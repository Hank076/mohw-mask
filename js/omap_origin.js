var omap;
var marker_user;
var markers;
var default_lat = 25.0315785;
var default_lng = 121.4427123;
var mask_inventory = [];
var test_kit_inventory = [];
var inventory_last_update = '';
var pharmacyListScript;

//預設篩選選項
var show_all_inventory = false;
var show_adult_inventory = false;
var show_child_inventory = false;
var show_test_kit_inventory = true;
var show_pcr_pos = false;
var show_gov_test_kit = false;
var dont_show_no_open = true;
var show_inventory_zero = false;

$(function () {
    //綁定搜尋事件
    $("#filter").click(function(event) {
        $(".filter_ctl").attr('disabled', true);
        updateFilterOption();
        showFilterResult();
    });

    //設定定時更新
    let clock = setInterval(function() {
        updateFilterOption();
        reloadStrongholdData(true);
    }, 120000);

    //載入口罩&快篩販售點
    pharmacyListScript = document.createElement('script');
    pharmacyListScript.src = '/js/pharmacy_auto.js?r='+getCacheNumber();
    pharmacyListScript.onload = function () {
        loadMaskInventory();
        createMap();
        getUserGEOInfo(false); //取得使用者位置資訊
    };
    document.head.appendChild(pharmacyListScript);

    //載入社區篩檢站點
    let pcrListScript = document.createElement('script');
    pcrListScript.src = '/js/gov_pcr_auto.js?r='+getCacheNumber();
    document.head.appendChild(pcrListScript);

    //載入公費篩檢發放點
    let govTestKitListScript = document.createElement('script');
    govTestKitListScript.src = '/js/gov_covid19_test_kit_auto.js?r='+getCacheNumber();
    document.head.appendChild(govTestKitListScript);
});

var getCacheNumber = function(){
    let nowDate = new Date();
    let currentMinutes = nowDate.getMinutes();
    let currentMinutes_add = 5-(currentMinutes%5);
    let date = new Date(nowDate.getFullYear(), (nowDate.getMonth() + 1), nowDate.getDate(), nowDate.getHours(), currentMinutes+currentMinutes_add);
    return date.getTime();
};

var updateFilterOption = function(){
    dont_show_no_open = $("#dont_show_no_open").is(":checked");
    show_inventory_zero = $("#inventory_zero").is(":checked");

    show_all_inventory = false;
    show_adult_inventory = false;
    show_child_inventory = false;
    show_test_kit_inventory = false;
    show_pcr_pos = false;
    show_gov_test_kit = false;

    let type = $("input[name='type']:checked").val();

    if(type == '0'){ //不過濾
        show_all_inventory = true;

    }else if(type == '1'){ //只顯示成人 > 0
        show_adult_inventory = true;

    }else if(type == '2'){ //只顯示兒童 > 0
        show_child_inventory = true;

    }else if(type == '3'){ //顯示成人+兒童 > 0
        show_adult_inventory = true;
        show_child_inventory = true;

    }else if(type == '4'){ //顯示快篩試劑販售點
        show_test_kit_inventory = true;

    }else if(type == '5'){ //顯示社區篩檢站
        show_pcr_pos = true;
        
    }else if(type == '6'){ //顯示公費快篩發放站
        show_gov_test_kit = true;
    }
};

var getUserGEOInfo = function(galog) {
    if(galog === true){
        gtag('event', 'click', {
            'event_category': '地圖工具',
            'event_label': '使用者定位'
        });
    }

    if (navigator.geolocation) { //確認使用者裝置能不能抓地點
        let options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        //跟使用者拿所在位置
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);
    }
};

var geoSuccess = function(position) {
    let crd = position.coords;
    default_lat = crd.latitude;
    default_lng = crd.longitude;
    
    if(marker_user !== undefined){
        marker_user.setLatLng([default_lat, default_lng]);
    }else{
        marker_user = L.marker([default_lat, default_lng]);
        marker_user.addTo(omap);
    }
    omap.setView([default_lat, default_lng], 17);

    gtag('event', 'click', {
        'event_category': '地圖工具',
        'event_label': '使用者定位成功'
    });
};

var geoError = function(error) {
    let err_code = error.code;

    gtag('event', 'click', {
        'event_category': '地圖工具',
        'event_label': '使用者定位失敗' + err_code
    });
    
    //console.log('Error occurred. Error: ' + error.message + '(' + error.code + ')');
    // error.code can be:
    //   0: unknown error
    //   1: permission denied
    //   2: position unavailable (error response from location provider)
    //   3: timed out
};

var createMap = function() {
    omap = L.map('omap',{
        zoomControl: false
    });
    omap.on('load', onMapLoad);

    /*var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(omap);*/

    /*var CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 9
    }).addTo(omap);*/

    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://maps.nlsc.gov.tw/">國土測繪中心</a>',
        maxZoom: 19,
        minZoom: 9
    }).addTo(omap);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(omap);

    createCustomButton();

    markers = L.markerClusterGroup({
        chunkedLoading: true,
        disableClusteringAtZoom: 16,
        elementsPlacementStrategy:'original-locations'
    });
    
    omap.setView(['25.041772038439372', '121.45227755042832'], 13);

    reloadStrongholdData(false); //取得數量
};

var onMapLoad = function() {
    if(bShowWarningMessage){
        gtag('event', 'click', {
            'event_category': '提醒工具',
            'event_label': '重要訊息'
        });
        showWarningMessage();
    }else{
        showInfoMessage('auto');
    }
};

var createCustomButton = function() {
    L.control.custom({
        position: 'bottomright',
        content : '<button id="back_btn" type="button" class="btn btn-light" title="回到我的位置">'+
                  '    <i class="fa-solid fa-location-crosshairs"></i>'+
                  '</button>'+
                  '<button id="info_btn" type="button" class="btn btn-info" title="公告">'+
                  '    <i class="fa-solid fa-info"></i>'+
                  '</button>'+
                  '<button id="buy_mask_btn" type="button" class="btn btn-light" title="社交距離APP">'+
                  '    <a target="_blank" id="buy_mask" href="https://www.cdc.gov.tw/Category/Page/R8bAd_yiVi22CIr73qM2yw" title="社交距離APP" onclick="buy_mask();">'+
                  '        <i class="fa-solid fa-mobile-screen-button"></i>'+
                  '    </a>'+
                  '</button>'+
                  '<button id="reload_btn" type="button" class="btn btn-primary" title="重新整理">'+
                  '    <i class="fa-solid fa-arrows-rotate"></i>'+
                  '</button>'+
                  '<button id="history_btn" type="button" class="btn btn-success" title="更新紀錄">'+
                  '    <i class="fa-solid fa-rectangle-list"></i>'+
                  '</button>'+
                  '<button id="twcdc_fb_btn" type="button" class="btn btn-warning" title="疾管署">'+
                  '    <i class="fa-solid fa-square-virus"></i>'+
                  '</button>',
        classes : 'btn-group-vertical bt-group-sm',
        style   : {margin: '10px', padding: '0px 0 0 0', cursor: 'pointer',}
    }).addTo(omap);

    //綁定地圖小工具事件
    $("#back_btn").click(function(event) {
        getUserGEOInfo(true); //取得使用者位置資訊
    });

    $("#exclamation_btn").click(function(event) {
        showWarningMessage();
    });

    $("#info_btn").click(function(event) {
        gtag('event', 'click', {
            'event_category': '提醒工具',
            'event_label': '提醒資訊'
        });
        showInfoMessage('manual');
    });

    $("#buy_mask").click(function(event) {
        gtag('event', 'click', {
            'event_category': '提醒工具',
            'event_label': '社交距離APP'
        });
    });

    $("#reload_btn").click(function(event) {
        showUpdateProcess();
    });
    $("#history_btn").click(function(event) {
        gtag('event', 'click', {
            'event_category': '提醒工具',
            'event_label': '網站歷程'
        });
        showVersionHistory();
    });
    $("#twcdc_fb_btn").click(function(event) {
        showTwcdcFB();
    });
};

var showUpdateProcess = function(){
    let jc = $.dialog({
        icon: 'fa-solid fa-arrows-spin fa-spin',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '資料更新中',
        content: '正在抓取最新庫存資訊...',
        onOpen: function(){
            //更新地圖
            if(show_pcr_pos || show_gov_test_kit){
                createOtherStrongholdData(false);
            }else{
                createStrongholdData(false);
            }
            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();

            //GA事件紀錄
            gtag('event', 'click', {
                'event_category': '地圖工具',
                'event_label': '更新地圖'
            });
        }
    });
};

var showTwcdcFB = function(){
    $.dialog({
        icon: 'fa-solid fa-square-virus',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '疾病管制署 - 粉絲團',
        content: '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FTWCDC&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId=544411143087055" width="340" height="500" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>',
        backgroundDismiss: true,
        onOpen: function(){
            //GA事件紀錄
            gtag('event', 'click', {
                'event_category': '提醒工具',
                'event_label': '疾管署粉絲團'
            });
        }
    });
};

var showFilterResult = function(){   
    let jc = $.dialog({
        icon: 'fa-solid fa-spinner fa-spin',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '資料過濾中',
        content: '正在過濾庫存資訊...',
        onOpen: function(){

            //清除 markers
            markers.clearLayers();
    
            //更新地圖
            if(show_pcr_pos || show_gov_test_kit){
                createOtherStrongholdData();
            }else{
                createStrongholdData();
            }

            $(".filter_ctl").attr('disabled', false);

            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();

            //GA 事件紀錄
            let type = $("input[name='type']:checked").val();
            let ga_event_label = '';
    
            if(dont_show_no_open){
                ga_event_label += '有營業, ';
            }else{
                ga_event_label += '不論營業, ';
            }
    
            if(type == '0'){
                //不過濾
                ga_event_label += '所有';
    
            }else if(type == '1'){
                //只顯示成人 > 0
                ga_event_label += '僅成人';
    
            }else if(type == '2'){
                //只顯示兒童 > 0
                ga_event_label += '僅兒童';
    
            }else if(type == '3'){
                //顯示成人+兒童 > 0
                ga_event_label += '成人與兒童';

            }else if(type == '4'){
                //顯示快篩試劑
                ga_event_label += '快篩試劑';
            }else if(type == '5'){
                //顯示PCR採檢站
                ga_event_label += 'PCR採檢站';
            }else if(type == '6'){
                //顯示公費快篩發放站
                ga_event_label += '公費快篩發放站';
            }
    
            gtag('event', 'click', {
                'event_category': '搜尋工具',
                'event_label': ga_event_label
            });
        }
    });
};

var reloadStrongholdData = function(isAsyncMode){
    $('#reload_btn').attr('disabled', true);
    $("#reload_btn i").removeClass();
    $("#reload_btn i").addClass('fa-solid fa-arrows-rotate fa-spin fa-fw');

    loadPharmacyList();
    if(show_test_kit_inventory){
        $('#inventory_last_update').html('<span id="process_status" class="fa fa-spinner fa-spin"></span>');
        if(isAsyncMode == true){
            //loadMaskInventory(isAsyncMode); //取得口罩剩餘數量
            loadTestKitInventory(isAsyncMode); //取得快篩試劑剩餘數量(因為註解上面才新增這條, 不然上面做完會自動 call loadTestKitInventory(isAsyncMode))
        }else{
            //loadMaskInventory(isAsyncMode); //取得口罩剩餘數量
            loadTestKitInventory(isAsyncMode); //取得快篩試劑剩餘數量    
        }
    }else{
        createOtherStrongholdData();
    }
};

//抓取藥局清單
var loadPharmacyList = function(){
    pharmacyListScript = document.createElement('script');
    pharmacyListScript.src = '/js/pharmacy_auto.js?r=' + getCacheNumber();
    document.head.appendChild(pharmacyListScript); //or something of the likes
};

//抓取口罩庫存
var loadMaskInventory = function(isAsyncMode) {
    mask_inventory = [];
    $.ajax({
        url: "data/maskdata_auto.csv",
        async: isAsyncMode,
        cache: false,
        dataType: "text",
        success: function (csvd) {
            let data = csvd.split("\n");
            for (let i in data) {
                if ({}.hasOwnProperty.call(data, i)) {
                    let currentData = data[i].split(",");
                    if ($.trim(currentData[0]) != '') {
                        mask_inventory[currentData[0]] = [currentData[1], currentData[2], currentData[3].replace(/\"/g,''), currentData[4].replace(/\"/g,'')];
                    }
                }
            }
        },
        complete: function(jqXHR, textStatus){
            if(isAsyncMode == true){
                loadTestKitInventory(isAsyncMode); //取得快篩試劑剩餘數量    
            }
        }
    });
};

//抓取快篩試劑庫存
var loadTestKitInventory = function(isAsyncMode) {
    test_kit_inventory = [];
    $.ajax({
        url: "data/test_kits_auto.csv",
        async: isAsyncMode,
        cache: false,
        dataType: "text",
        success: function (csvd) {
            let data = csvd.split("\n");
            for (let i in data) {
                if ({}.hasOwnProperty.call(data, i)) {
                    let currentData = data[i].split(",");
                    if ($.trim(currentData[0]) != '') {
                        test_kit_inventory[currentData[0]] = [currentData[1], currentData[2], currentData[3].replace(/\"/g,''), currentData[4].replace(/\"/g,'')];
                    }
                }
            }
        },
        complete: function(jqXHR, textStatus){
          createStrongholdData();
        }
    });
};

var createStrongholdData = function(){
    if(markers !== undefined){
        markers.clearLayers(); //清除 markers
    }

    let current_week = new Date();
    current_week = current_week.getDay();

    for (let key in locations) {
        if ({}.hasOwnProperty.call(locations, key)) {
            let main_add_status = true; //該據點是否要加入地圖顯示
            let mask_add_status = true; //該據點是否要加入地圖顯示
            let test_kit_add_status = true; //該據點是否要加入地圖顯示

            let stronghold = locations[key];
            let mask_inventory_txt = "<i class='fa-solid fa-mask-face'></i>&nbsp;無庫存";
            let test_kit_inventory_txt = "<i class='fa-solid fa-vial-virus'></i>&nbsp;無庫存";
            let adult_count = 0;
            let child_count = 0;
            let test_kit_count = 0;

            let main_between_time_lv = 0;
            let mask_between_time_lv = 0;
            let test_kit_between_time_lv = 0;
        
            //口罩資訊
            if (mask_inventory[stronghold.id] !== undefined && (show_adult_inventory || show_child_inventory || show_all_inventory)) {
                
                let maskInventoryInfo = mask_inventory[stronghold.id];
                adult_count = parseInt(maskInventoryInfo[0]);
                child_count = parseInt(maskInventoryInfo[1]);

                //是否要過濾無庫存的銷售點
                if(show_adult_inventory && show_inventory_zero == false){ //只顯示有成人口罩庫存的據點
                    if(mask_add_status && adult_count <= 0){
                        mask_add_status = false;
                    }
                }else if(show_child_inventory && show_inventory_zero == false){ //只顯示有兒童口罩庫存的據點
                    if(mask_add_status && child_count <= 0){
                        mask_add_status = false;
                    }
                } 

                if(mask_add_status){
                    let dateBegin = new Date(maskInventoryInfo[2].replace(/-/g, "/"));//將-轉化為/，使用new Date
                    let dateEnd = new Date();//獲取當前時間
                    let dateDiff = (dateEnd.getTime() - dateBegin.getTime()) / 1000;//時間差的毫秒數
    
                    if (dateDiff > 60*60*8){ //8hr~
                        mask_between_time_lv = 4;
                    }else if (dateDiff > 60*60*4){ //4~8hr
                        mask_between_time_lv = 3;
                    }else if (dateDiff > 60*60*2){ //2~4hr
                        mask_between_time_lv = 2;
                    }else{ //~2hr
                        mask_between_time_lv = 1;
                    }
                }

                let inventoryCount = adult_count + child_count;
                if (inventoryCount > 0) {
                    mask_inventory_txt = "<i class='fa-solid fa-user'></i>&nbsp;" + adult_count + "&nbsp;<i class='fa-solid fa-child'></i>&nbsp;" + child_count;
                }
            }else{
                mask_add_status = false;
                mask_inventory_txt = '';
            }

            //快篩資訊
            if (test_kit_inventory[stronghold.id] !== undefined && (show_test_kit_inventory || show_all_inventory)) {
                test_kit_count = parseInt(test_kit_inventory[stronghold.id][1]);

                //是否要過濾無庫存的銷售點
                if(show_inventory_zero == false){ 
                    if(test_kit_add_status && test_kit_count <= 0){
                        test_kit_add_status = false;
                    }
                }

                if(test_kit_add_status){
                    let dateBegin = new Date(test_kit_inventory[stronghold.id][2].replace(/-/g, "/"));//將-轉化為/，使用new Date
                    let dateEnd = new Date();//獲取當前時間
                    let dateDiff = (dateEnd.getTime() - dateBegin.getTime()) / 1000;//時間差的毫秒數
    
                    if (dateDiff > 60*60*8){ //8hr~
                        test_kit_between_time_lv = 4;
                    }else if (dateDiff > 60*60*4){ //4~8hr
                        test_kit_between_time_lv = 3;
                    }else if (dateDiff > 60*60*2){ //2~4hr
                        test_kit_between_time_lv = 2;
                    }else{ //~2hr
                        test_kit_between_time_lv = 1;
                    }
                }

                if (test_kit_count == 78) {
                    test_kit_inventory_txt = "<i class='fa-solid fa-vial-virus'></i>&nbsp;" + test_kit_count + ' (可能未到貨)';
                }else if (test_kit_count > 0) {
                    test_kit_inventory_txt = "<i class='fa-solid fa-vial-virus'></i>&nbsp;" + test_kit_count;
                }
            }else{
                test_kit_add_status = false;
                test_kit_inventory_txt = '';
            }

            if(mask_inventory_txt == '' && test_kit_inventory_txt == ''){
                main_add_status = false;
            }else{
                main_add_status = mask_add_status || test_kit_add_status;
            }

            if(dont_show_no_open && stronghold.business_week !== undefined && main_add_status){
                let t1, t2, t3;
                let business_week = stronghold.business_week.split('');

                if(current_week == 1){
                    main_add_status = !(business_week[0] == 'X' && business_week[7] == 'X' && business_week[14] == 'X');
                    t1 = business_week[0]; t2 = business_week[7]; t3 = business_week[14];
                }else if(current_week == 2){
                    main_add_status = !(business_week[1] == 'X' && business_week[8] == 'X' && business_week[15] == 'X');
                    t1 = business_week[1]; t2 = business_week[8]; t3 = business_week[15];
                }else if(current_week == 3){
                    main_add_status = !(business_week[2] == 'X' && business_week[9] == 'X' && business_week[16] == 'X');
                    t1 = business_week[2]; t2 = business_week[9]; t3 = business_week[16];
                }else if(current_week == 4){
                    main_add_status = !(business_week[3] == 'X' && business_week[10] == 'X' && business_week[17] == 'X');
                    t1 = business_week[3]; t2 = business_week[10]; t3 = business_week[17];
                }else if(current_week == 5){
                    main_add_status = !(business_week[4] == 'X' && business_week[11] == 'X' && business_week[18] == 'X');
                    t1 = business_week[4]; t2 = business_week[11]; t3 = business_week[18];
                }else if(current_week == 6){
                    main_add_status = !(business_week[5] == 'X' && business_week[12] == 'X' && business_week[19] == 'X');
                    t1 = business_week[5]; t2 = business_week[12]; t3 = business_week[19];
                }else if(current_week == 0){
                    main_add_status = !(business_week[6] == 'X' && business_week[13] == 'X' && business_week[20] == 'X');
                    t1 = business_week[6]; t2 = business_week[13]; t3 = business_week[20];
                }

                if(main_add_status){
                    main_add_status = checkTimerOpen(t1, t2, t3, main_add_status);
                }
            }

            if(main_add_status){

                let more = '';
                if(stronghold.memo !== undefined){
                    let memo = $.trim(stronghold.memo);
                    if(memo.length > 0){
                        //if(memo.indexOf('口罩') != -1 || memo.indexOf('快篩') != -1 || memo.indexOf('號碼') != -1){ 
                            more = "購買規則<span class='fa-solid fa-angle-right'></span>";
                        //}
                    }
                }

                if(show_adult_inventory || show_child_inventory){
                    main_between_time_lv = mask_between_time_lv;
                }else if(show_test_kit_inventory){
                    main_between_time_lv = test_kit_between_time_lv;
                }else{
                    main_between_time_lv = mask_between_time_lv < test_kit_between_time_lv ? mask_between_time_lv : test_kit_between_time_lv;
                }

                //設定 icon 所需寬度
                /*
                var icon_width = 100;
                var string_len = adult_count.toString().concat(child_count.toString()).concat(test_kit_count.toString()).length;
                if((mask_inventory_txt == "無庫存" || test_kit_inventory_txt == "無庫存") && more == ''){
                    icon_width = 52;
                }else if((mask_inventory_txt == "無庫存" || test_kit_inventory_txt == "無庫存") && more != ''){
                    icon_width = 82;
                }else if(string_len < 6 && more == ''){
                    icon_width = 68;
                }else if(string_len < 6 && more != ''){
                    icon_width = 82;
                }else if(string_len == 6){
                    icon_width = 84;
                }else if(string_len == 7){
                    icon_width = 92;
                }else if(string_len == 8){
                    icon_width = 100;
                }*/

                if(mask_inventory_txt.length > 0){
                    test_kit_inventory_txt = '&nbsp;' + test_kit_inventory_txt;
                }

                let myIcon = L.divIcon({
                    //popupAnchor: [0, -30],
                    //iconAnchor: [(icon_width/2), 0],
                    iconSize:null,
                    html:'<div class="map-label"><div class="map-label-content time-Lv'+ main_between_time_lv +'">' + mask_inventory_txt + test_kit_inventory_txt + '<div class="map-label-content-more">' + more + '</div></div><div class="map-label-arrow"></div></div>'
                });
    
                let marker = L.marker([stronghold.lat, stronghold.lng], {
                    icon: myIcon,
                    title: stronghold.name,
                    alt: stronghold.name
                }).bindPopup(strongholdInfo(stronghold), {
                    minWidth: 210
                }).on('popupopen', function (popup) {
                    $(".question_btn").click(function(event) {
                        showQuestionInfo();
                    });

                    $(".moreBusinessInfo").click(function () {
                        let $title = $(this).find(".title");
                        if (!$title.length) {
                            $(this).append('<span class="title">' + $(this).attr("title") + '</span>');
                        } else {
                            $title.remove();
                        }
                    });

                    $(".showBusinessWeek").click(function(event) {
                        $('#businessWeek').toggle(500);
                    });

                    gtag('event', 'click', {
                        'event_category': '販售據點',
                        'event_label': popup.popup._source.pid
                    });
                });
                marker.pid = stronghold.id + stronghold.name;
                markers.addLayer(marker);
            }
        }
    }
    omap.addLayer(markers);
    $("#reload_btn i").removeClass();
    $("#reload_btn i").addClass('fa-solid fa-arrows-rotate');
    $('#reload_btn').attr('disabled', false);
    $('#inventory_last_update').text(inventory_last_update.substr(5).replace(/-/g, "/"));
};

var createOtherStrongholdData = function(){
    if(markers !== undefined){
        markers.clearLayers(); //清除 markers
    }

    let current_week = new Date();
    current_week = current_week.getDay();

    let datasheet;
    if(show_pcr_pos){
        datasheet = gov_pcr_locations;
    }else if(show_gov_test_kit){
        datasheet = gov_covid19_test_kit_locations;
    }

    for (let key in datasheet) {

        if ({}.hasOwnProperty.call(datasheet, key)) {
            let stronghold = datasheet[key];
            let main_add_status = true;

            if(dont_show_no_open && stronghold.business_week !== undefined && main_add_status && stronghold.name.indexOf('醫院')==-1){
                let t1, t2, t3;
                let business_week = stronghold.business_week.split('');

                if(current_week == 1){
                    main_add_status = !(business_week[0] == 'X' && business_week[7] == 'X' && business_week[14] == 'X');
                    t1 = business_week[0]; t2 = business_week[7]; t3 = business_week[14];
                }else if(current_week == 2){
                    main_add_status = !(business_week[1] == 'X' && business_week[8] == 'X' && business_week[15] == 'X');
                    t1 = business_week[1]; t2 = business_week[8]; t3 = business_week[15];
                }else if(current_week == 3){
                    main_add_status = !(business_week[2] == 'X' && business_week[9] == 'X' && business_week[16] == 'X');
                    t1 = business_week[2]; t2 = business_week[9]; t3 = business_week[16];
                }else if(current_week == 4){
                    main_add_status = !(business_week[3] == 'X' && business_week[10] == 'X' && business_week[17] == 'X');
                    t1 = business_week[3]; t2 = business_week[10]; t3 = business_week[17];
                }else if(current_week == 5){
                    main_add_status = !(business_week[4] == 'X' && business_week[11] == 'X' && business_week[18] == 'X');
                    t1 = business_week[4]; t2 = business_week[11]; t3 = business_week[18];
                }else if(current_week == 6){
                    main_add_status = !(business_week[5] == 'X' && business_week[12] == 'X' && business_week[19] == 'X');
                    t1 = business_week[5]; t2 = business_week[12]; t3 = business_week[19];
                }else if(current_week == 0){
                    main_add_status = !(business_week[6] == 'X' && business_week[13] == 'X' && business_week[20] == 'X');
                    t1 = business_week[6]; t2 = business_week[13]; t3 = business_week[20];
                }

                if(main_add_status){
                    //main_add_status = checkTimerOpen(t1, t2, t3, main_add_status);
                }
            }

            if(main_add_status){

                let more = '';
                if(stronghold.memo !== undefined){
                    let memo = $.trim(stronghold.memo);
                    if(memo.length > 0){
                        more = "詳細資訊<span class='fa-solid fa-angle-right'></span>";
                    }
                }

                let myIcon = L.divIcon({
                    iconSize:null,
                    html:'<div class="map-label"><div class="map-label-content">' + stronghold.name + '<div class="map-label-content-more">' + more + '</div></div><div class="map-label-arrow"></div></div>'
                });
    
                let marker = L.marker([stronghold.lat, stronghold.lng], {
                    icon: myIcon,
                    title: stronghold.name,
                    alt: stronghold.name
                }).bindPopup(strongholdInfo(stronghold), {
                    minWidth: 210
                }).on('popupopen', function (popup) {
                    $(".question_btn").click(function(event) {
                        showQuestionInfo();
                    });

                    $(".moreBusinessInfo").click(function () {
                        let $title = $(this).find(".title");
                        if (!$title.length) {
                            $(this).append('<span class="title">' + $(this).attr("title") + '</span>');
                        } else {
                            $title.remove();
                        }
                    });

                    $(".showBusinessWeek").click(function(event) {
                        $('#businessWeek').toggle(500);
                    });

                    gtag('event', 'click', {
                        'event_category': '採檢據點',
                        'event_label': popup.popup._source.pid
                    });
                });
                marker.pid = stronghold.id + stronghold.name;
                markers.addLayer(marker);
            }
        }
    }
    omap.addLayer(markers);

    $("#reload_btn i").removeClass();
    $("#reload_btn i").addClass('fa-solid fa-arrows-rotate');
    $('#reload_btn').attr('disabled', false);
};

var strongholdInfo = function(stronghold) {
    let name = stronghold.name;
    let tel = stronghold.tel;
    let addr = stronghold.addr;
    let maskInventoryInfo = mask_inventory[stronghold.id];
    let testKitInventoryInfo = test_kit_inventory[stronghold.id];

    let infoHTML = "<div class=''><h3>" + name + "</h3>";
    infoHTML += "電話：<a class='link-primary' href='tel:" + tel + "'>" + tel + "</a> <i class='fa-solid fa-square-phone-flip text-primary'></i><br />";
    infoHTML += "地址：<a target='_blank' class='link-primary' href='https://www.google.com/maps/dir/?api=1&destination=" + addr + "'>" + addr + "</a> <i class='fa-solid fa-map-location-dot text-primary'></i><br />";

    infoHTML += "<br /><b>口罩剩餘數量</b> (<span class='question_btn link-style' title='資訊有誤嗎？'>資訊有誤嗎？</span>)<br />";
    if (maskInventoryInfo === undefined) {
        infoHTML += "無資料" + "<br />";
    } else {
        let reportTime = '無紀錄';
        if(maskInventoryInfo[2] != ''){
            reportTime = maskInventoryInfo[2].substr(5).replace(/-/g, "/") + ' (' + calcLastTimeRange(maskInventoryInfo[2]) + ')';
        }

        if(maskInventoryInfo[0] == 0 && maskInventoryInfo[1] == 0){
            infoHTML += "無庫存";
        }else{
            infoHTML += "成人 <i class='fa-solid fa-user'></i>：" + maskInventoryInfo[0] + "　兒童 <i class='fa-solid fa-child'></i>：" + maskInventoryInfo[1];
        }

        let parserData = "程式最後抓取時間: " + maskInventoryInfo[3];

        infoHTML += "<br /><span class='moreBusinessInfo' title='"+ parserData + "'>商家更新時間：" + reportTime + "</span><br />";
        //infoHTML += "<br />更新時間：" + maskInventoryInfo[2] + "<br />";

        //顯示最新的更新時間
        let newDate = Date.parse(maskInventoryInfo[3].replace(/-/g, "/"));
        let currectDate = Date.parse(inventory_last_update.replace(/-/g, "/"));
        if((newDate - currectDate > 0) || inventory_last_update == ''){
            inventory_last_update = maskInventoryInfo[3];
        }
    }

    infoHTML += "<br /><b>快篩剩餘數量</b><br />";
    if (testKitInventoryInfo === undefined) {
        infoHTML += "無資料" + "<br />";
    } else {
        let reportTime = '無紀錄';
        if(testKitInventoryInfo[2] != ''){
            reportTime = testKitInventoryInfo[2].substr(5).replace(/-/g, "/") + ' (' + calcLastTimeRange(testKitInventoryInfo[2]) + ')';
        }

        if(testKitInventoryInfo[1] == 78){
            infoHTML += "可能無庫存 (78份進貨可能未到)";
        }else if(testKitInventoryInfo[1] == 0){
            infoHTML += "無庫存";
        }else{
            infoHTML += testKitInventoryInfo[0] + " <i class='fa-solid fa-vial-virus'></i>：" + testKitInventoryInfo[1];
        }

        let parserData = "程式最後抓取時間: " + testKitInventoryInfo[3];

        infoHTML += "<br /><span class='moreBusinessInfo' title='"+ parserData + "'>商家更新時間：" + reportTime + "</span><br />";
        //infoHTML += "<br />更新時間：" + testKitInventoryInfo[2] + "<br />";

        //顯示最新的更新時間
        let newDate = Date.parse(testKitInventoryInfo[3].replace(/-/g, "/"));
        let currectDate = Date.parse(inventory_last_update.replace(/-/g, "/"));
        if((newDate - currectDate > 0) || inventory_last_update == ''){
            inventory_last_update = testKitInventoryInfo[3];
        }
    }
    
    if (stronghold.business_week != undefined) {
        if(stronghold.name.indexOf('醫院')!=-1 && show_pcr_pos){
            infoHTML += "<br/><b>營業資訊</b><br/>";
            infoHTML += "<span class='text-danger'>醫院社區採檢時間請詳閱醫院官網查詢</span>";

        }else{
            let business_week = stronghold.business_week.split('');
            infoHTML += "<br/><b>營業資訊</b> <span class='showBusinessWeek link-style'>(點我顯示或隱藏)</span><br/>";
            infoHTML += "<table id='businessWeek' style='display:none;' class='tg'><tr><th class='tg-lboi'></th><th class='tg-lboi'>一</th><th class='tg-lboi'>二</th><th class='tg-lboi'>三</th><th class='tg-lboi'>四</th><th class='tg-lboi'>五</th><th class='tg-lboi'>六</th><th class='tg-lboi'>日</th></tr><tr><td class='tg-lboi'>上</td><td class='tg-lboi'>" + business_week[0] + "</td><td class='tg-lboi'>" + business_week[1] + "</td><td class='tg-lboi'>" + business_week[2] + "</td><td class='tg-lboi'>" + business_week[3] + "</td><td class='tg-lboi'>" + business_week[4] + "</td><td class='tg-weekend'>" + business_week[5] + "</td><td class='tg-weekend'>" + business_week[6] + "</td></tr><tr><td class='tg-lboi'>下</td><td class='tg-lboi'>" + business_week[7] + "</td><td class='tg-lboi'>" + business_week[8] + "</td><td class='tg-lboi'>" + business_week[9] + "</td><td class='tg-lboi'>" + business_week[10] + "</td><td class='tg-lboi'>" + business_week[11] + "</td><td class='tg-weekend'>" + business_week[12] + "</td><td class='tg-weekend'>" + business_week[13] + "</td></tr><tr><td class='tg-lboi'>晚</td><td class='tg-lboi'>" + business_week[14] + "</td><td class='tg-lboi'>" + business_week[15] + "</td><td class='tg-lboi'>" + business_week[16] + "</td><td class='tg-lboi'>" + business_week[17] + "</td><td class='tg-lboi'>" + business_week[18] + "</td><td class='tg-weekend'>" + business_week[19] + "</td><td class='tg-weekend'>" + business_week[20] + "</td></tr></table>";    
        }
    }

    if(stronghold.memo !== undefined){
        let memo = $.trim(stronghold.memo);
        if (memo.length > 0) {
            if(memo.indexOf('口罩') != -1 || memo.indexOf('快篩') != -1 || memo.indexOf('號碼牌') != -1 || memo.indexOf('庫存') != -1){ 
                infoHTML += "<br/><span class='highred'>備註：" + memo + '</span>';
            }else{
                infoHTML += "<br/>備註：" + memo;
            }
        }
    }

    return infoHTML+'</div>';
};

var checkTimerOpen = function(t1, t2, t3, status){
    let nowDate = new Date();
    let current_hour = nowDate.getHours();
    
    //關閉已過營業時間且後續無營業的據點
    if(current_hour >= 13 && t2 == 'X' && t3 == 'X'){
        return false;
    }else if(current_hour >=18 && t3 == 'X'){
        return false;
    }else{
        return status;
    }

    /*
    //關閉當前時段無營業的據點
    if((current_hour >= 6 && current_hour < 12) && t1 == 'X'){
        return false;
    }else if((current_hour >= 12 && current_hour < 18) && t2 == 'X'){
        return false;
    }else if((current_hour >= 18) && t3 == 'X'){
        return false;
    }else{
        return status;
    }
    */
};

var calcLastTimeRange = function(timesData) {
    //如果時間格式是正確的，那下面這一步轉化時間格式就可以不用了
    let dateBegin = new Date(timesData.replace(/-/g, "/"));//將-轉化為/，使用new Date
    let dateEnd = new Date();//獲取當前時間
    let dateDiff = dateEnd.getTime() - dateBegin.getTime();//時間差的毫秒數
    let dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000));//計算出相差天數
    let leave1 = dateDiff % (24 * 3600 * 1000);    //計算天數後剩餘的毫秒數
    let hours = Math.floor(leave1 / (3600 * 1000));//計算出小時數
    //計算相差分鍾數
    let leave2 = leave1 % (3600 * 1000);    //計算小時數後剩餘的毫秒數
    let minutes = Math.floor(leave2 / (60 * 1000));//計算相差分鍾數
    //計算相差秒數
    //let leave3 = leave2 % (60 * 1000);      //計算分鍾數後剩餘的毫秒數
    //let seconds = Math.round(leave3 / 1000);
    let timesString = '';

    if (dayDiff != 0) {
        timesString = '<span class="highred" >' + dayDiff + '天前</span>';
    } else if (dayDiff == 0 && hours != 0) {
        timesString = '<span class="highred" >' + hours + '小時前</span>';
    } else if (dayDiff == 0 && hours == 0 && minutes >= 40) {
        timesString = '<span class="highred" >' + minutes + '分鍾前</span>';
    } else if (dayDiff == 0 && hours == 0) {
        timesString = minutes + '分鍾前';
    }

    return timesString;
};