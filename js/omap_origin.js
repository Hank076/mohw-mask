var omap;
var marker_user;
var markers;
var default_lat = 25.0315785;
var default_lng = 121.4427123;
var mask_inventory = [];

var show_adult_inventory = false;
var show_child_inventory = false;
var dont_show_null_inventory = true;
var dont_show_no_open = true;
var mask_inventory_last_update = '';

var show_inventory_hight = true;
var show_inventory_medium = true;
var show_inventory_low = true;
var show_inventory_zero = false;

$(function () {
    getUserGEOInfo(false); //取得使用者位置資訊
});

var geoSuccess = function(position) {
    var crd = position.coords;
    default_lat = crd.latitude;
    default_lng = crd.longitude;
    
    if(marker_user !== undefined){
        marker_user.setLatLng([default_lat, default_lng]);
    }else{
        if(omap === undefined){
            createMap();
        }

        marker_user = L.marker([default_lat, default_lng]).bindTooltip("我", {
            direction: "top",
            permanent: true
        }).openTooltip();
        marker_user.addTo(omap);
    }
    omap.setView([default_lat, default_lng], 16);
};

var geoError = function(error) {
    if(omap === undefined){
        createMap();
    }
    //console.log('Error occurred. Error: ' + error.message + '(' + error.code + ')');
    // error.code can be:
    //   0: unknown error
    //   1: permission denied
    //   2: position unavailable (error response from location provider)
    //   3: timed out
};

var getUserGEOInfo = function(galog) {
    if(galog === true){
        gtag('event', 'click', {
            'event_category': '地圖工具',
            'event_label': '使用者定位'
        });
    }

    if (navigator.geolocation) { //確認使用者裝置能不能抓地點
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        //跟使用者拿所在位置
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);
    }else{
        if(omap === undefined){
            createMap();
        }
    }
};

var onMapLoad = function() {
    showTopMessage();
};

var createMap = function() {
    
    omap = L.map('omap',{
        zoomControl: false
    });
    omap.on('load', onMapLoad);
    omap.setView([default_lat, default_lng], 16);

    /*L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 9,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(omap);*/

    /*var CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 9
    }).addTo(omap);*/

    var CartoDB_Voyager = L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://maps.nlsc.gov.tw/">國土測繪中心</a>',
        maxZoom: 20,
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

    loadMaskInventory(false); //取得口罩剩餘數量
};

var createCustomButton = function() {

    L.control.custom({
        position: 'bottomright',
        content : '<button id="back_btn" type="button" class="btn btn-default" title="回到我的位置">'+
                  '    <i class="fas fa-crosshairs"></i>'+
                  '</button>'+
                  '<button id="info_btn" type="button" class="btn btn-info" title="公告">'+
                  '    <i class="fas fa-info"></i>'+
                  '</button>'+
                  '<a target="_blank" id="buy_mask" href="https://emask.taiwan.gov.tw/" class="btn btn-default" title="預購口罩" onclick="buy_mask();">'+
                  '    <i class="fas fa-shopping-cart"></i>'+
                  '</a>'+
                  '<button id="reload_btn" type="button" class="btn btn-primary" title="重新整理">'+
                  '    <i class="fas fa-sync"></i>'+
                  '</button>'+
                  '<button id="history_btn" type="button" class="btn btn-success" title="更新紀錄">'+
                  '    <i class="fas fa-list-alt"></i>'+
                  '</button>'+
                  '<button id="twcdc_fb_btn" type="button" class="btn btn-warning" title="疾管署">'+
                  '    <i class="fas fa-clinic-medical"></i>'+
                  '</button>',
        classes : 'btn-group-vertical bt-group-sm',
        style   : {margin: '10px', padding: '0px 0 0 0', cursor: 'pointer',}
    }).addTo(omap);

    /*
                  '<button id="exclamation_btn" type="button" class="btn btn-danger" title="重要">'+
                  '    <i class="fas fa-exclamation-triangle"></i>'+
                  '</button>'+
    */

    $("#back_btn").click(function(event) {
        getUserGEOInfo(true); //取得使用者位置資訊
    });
    $("#exclamation_btn").click(function(event) {
        showWarningMessage();
    });
    $("#info_btn").click(function(event) {
        showInfoMessage();
    });
    $("#reload_btn").click(function(event) {
        showUpdateProcess();
    });
    $("#history_btn").click(function(event) {
        showVersionHistory();
    });
    $("#twcdc_fb_btn").click(function(event) {
        showTwcdcFB();
    });
};

var reloadStrongholdData = function(isAsyncMode){
    $('#reload_btn').attr('disabled', true);
    $("#reload_btn i").removeClass();
    $("#reload_btn i").addClass('fas fa-sync fa-spin fa-fw');
    $('#mask_inventory_last_update').html('<span id="process_status" class="fa fa-spinner fa-spin"></span>');
    
    loadMaskInventory(isAsyncMode); //取得口罩剩餘數量
};

var checkTimerOpen = function(t1, t2, t3, status){
    var nowDate = new Date();
    var current_hour = nowDate.getHours();
    
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

var strongholdInfo = function(stronghold) {
    var name = stronghold.name;
    var tel = stronghold.tel;
    var addr = stronghold.addr;
    var maskInventoryInfo = mask_inventory[stronghold.id];

    var infoHTML = "<h3>" + name + "</h3>";
    infoHTML += "電話：<a href='tel:+886" + tel + "'><i class='fas fa-phone-alt'></i> " + tel + "</a><br />";
    infoHTML += "地址：<a target='_blank' href='https://www.google.com/maps/dir/?api=1&destination=" + addr + "'><i class='fas fa-map-marked-alt'></i> " + addr + "</a><br />";

    infoHTML += "<br /><b>口罩剩餘數量</b> (<span class='question_btn link-style' title='資訊有誤嗎？'>資訊有誤嗎？</span>)<br />";
    if (maskInventoryInfo === undefined) {
        infoHTML += "無資料" + "<br />";
    } else {
        reportTime = maskInventoryInfo[3];
        reportTime = '無紀錄';
        if(maskInventoryInfo[2] != ''){
            reportTime = maskInventoryInfo[2].substr(5).replace(/-/g, "/") + ' (' + calcLastTimeRange(maskInventoryInfo[2]) + ')';
        }

        if(maskInventoryInfo[0] == 0 && maskInventoryInfo[1] == 0){
            infoHTML += "無庫存";
        }else{
            infoHTML += "成人 <i class='fas fa-user'></i>：" + maskInventoryInfo[0] + "　兒童 <i class='fas fa-baby'></i>：" + maskInventoryInfo[1];
        }

        detailData = "大人最後增加時間: "+maskInventoryInfo[4]+"<br />小孩最後增加時間: "+maskInventoryInfo[6]+"<br />大人最後減少時間: "+maskInventoryInfo[5]+"<br />小孩最後減少時間: "+maskInventoryInfo[7];

        infoHTML += "<br /><span class='moreBusinessInfo' title='"+ detailData + "'>最後異動時間：" + reportTime + "</span><br />";
        //infoHTML += "<br />更新時間：" + maskInventoryInfo[2] + "<br />";

        //顯示最新的更新時間
        var newDate = Date.parse(maskInventoryInfo[3].replace(/-/g, "/"));
        var currectDate = Date.parse(mask_inventory_last_update.replace(/-/g, "/"));
        if((newDate - currectDate > 0) || mask_inventory_last_update == ''){
            mask_inventory_last_update = maskInventoryInfo[3];
        }
    }
    
    if (stronghold.business_week != undefined) {
        var business_week = stronghold.business_week.split('');
        infoHTML += "<br/><b>營業資訊</b><span class='showBusinessWeek link-style'> (點我顯示或隱藏)</span><br/>";
        infoHTML += "<table id='businessWeek' style='display:none;' class='tg'><tr><th class='tg-lboi'></th><th class='tg-lboi'>一</th><th class='tg-lboi'>二</th><th class='tg-lboi'>三</th><th class='tg-lboi'>四</th><th class='tg-lboi'>五</th><th class='tg-lboi'>六</th><th class='tg-lboi'>日</th></tr><tr><td class='tg-lboi'>上</td><td class='tg-lboi'>" + business_week[0] + "</td><td class='tg-lboi'>" + business_week[1] + "</td><td class='tg-lboi'>" + business_week[2] + "</td><td class='tg-lboi'>" + business_week[3] + "</td><td class='tg-lboi'>" + business_week[4] + "</td><td class='tg-weekend'>" + business_week[5] + "</td><td class='tg-weekend'>" + business_week[6] + "</td></tr><tr><td class='tg-lboi'>下</td><td class='tg-lboi'>" + business_week[7] + "</td><td class='tg-lboi'>" + business_week[8] + "</td><td class='tg-lboi'>" + business_week[9] + "</td><td class='tg-lboi'>" + business_week[10] + "</td><td class='tg-lboi'>" + business_week[11] + "</td><td class='tg-weekend'>" + business_week[12] + "</td><td class='tg-weekend'>" + business_week[13] + "</td></tr><tr><td class='tg-lboi'>晚</td><td class='tg-lboi'>" + business_week[14] + "</td><td class='tg-lboi'>" + business_week[15] + "</td><td class='tg-lboi'>" + business_week[16] + "</td><td class='tg-lboi'>" + business_week[17] + "</td><td class='tg-lboi'>" + business_week[18] + "</td><td class='tg-weekend'>" + business_week[19] + "</td><td class='tg-weekend'>" + business_week[20] + "</td></tr></table>";
    }

    if(stronghold.memo !== undefined){
        var memo = $.trim(stronghold.memo);
        if (memo.length > 0) {
            if(memo.indexOf('口罩') != -1){ 
                infoHTML += "<br/><span class='highred'>備註：" + memo + '</span>';
            }else{
                infoHTML += "<br/>備註：" + memo;
            }
        }
    }

    return infoHTML;
};

var loadMaskInventory = function(isAsyncMode) {
    mask_inventory = [];
    //"data/maskdata.csv"
    //https://data.nhi.gov.tw/resource/mask/maskdata.csv

    var nowDate = new Date();
    var currentMinutes = nowDate.getMinutes();
    currentMinutes = ((parseInt((currentMinutes + 10) / 10) - 1) * 10) + 5;
    var date = new Date(nowDate.getFullYear(), (nowDate.getMonth() + 1), nowDate.getDate(), nowDate.getHours(), currentMinutes);
    var cacheNumber = date.getTime();

    $.ajax({
        url: "data/maskdata_auto.csv",
        async: isAsyncMode,
        cache: false,
        data: {
            r: cacheNumber
        },
        dataType: "text",
        success: function (csvd) {
            var data = csvd.split("\n");
            for (var i in data) {
                if ({}.hasOwnProperty.call(data, i)) {
                    var currentData = data[i].split(",");
                    if ($.trim(currentData[0]) != '') {
                        mask_inventory[currentData[0]] = [currentData[1], currentData[2], currentData[3].replace(/\"/g,''), currentData[4].replace(/\"/g,''), currentData[5].replace(/\"/g,''), currentData[6].replace(/\"/g,''), currentData[7].replace(/\"/g,''), currentData[8].replace(/\"/g,'')];
                    }
                }
            }
            createStrongholdData(); //更新地圖
        },
        complete: function(jqXHR, textStatus){
          // Handle the complete event
          $("#reload_btn i").removeClass();
          $("#reload_btn i").addClass('fas fa-sync');
          $('#reload_btn').attr('disabled', false);
        }
    });
};

var createStrongholdData = function(){

    if(markers !== undefined){
        markers.clearLayers(); //清除 markers
    }

    var current_week = new Date();
    current_week = current_week.getDay();

    for (var key in locations) {
        if ({}.hasOwnProperty.call(locations, key)) {
            var add_status = true; //該據點是否要加入地圖顯示
            var stronghold = locations[key];
            var inventory = "";
            var adult_count = 0;
            var child_count = 0;
        
            if (mask_inventory[stronghold.id] !== undefined) {

                inventory = mask_inventory[stronghold.id];
                adult_count= parseInt(inventory[0]);
                child_count= parseInt(inventory[1]);

                if(show_adult_inventory){ //只顯示有成人口罩庫存的據點
                    if(adult_count <= 2 && add_status){
                        add_status = false;
                    }
                }else if(show_child_inventory){ //只顯示有兒童口罩庫存的據點
                    if(child_count <= 2 && add_status){
                        add_status = false;
                    }
                }

                var inventoryCount = adult_count + child_count;
                if (inventoryCount > 0) {
                    inventory = "<i class='fas fa-user'></i>" + adult_count + "&nbsp;<i class='fas fa-baby'></i>" + child_count;
                } else {
                    inventory = "無庫存";
                }
            } else {
                inventory = "無庫存";
            }

            if(inventory == "無庫存"){
                if(show_inventory_zero === false && add_status){
                    add_status = false;
                }
            }

            if(dont_show_no_open && stronghold.business_week !== undefined){
                var t1, t2, t3;
                var business_week = stronghold.business_week.split('');

                if(current_week == 1 && add_status){
                    add_status = !(business_week[0] == 'X' && business_week[7] == 'X' && business_week[14] == 'X');
                    t1 = business_week[0]; t2 = business_week[7]; t3 = business_week[14];
                }else if(current_week == 2 && add_status){
                    add_status = !(business_week[1] == 'X' && business_week[8] == 'X' && business_week[15] == 'X');
                    t1 = business_week[1]; t2 = business_week[8]; t3 = business_week[15];
                }else if(current_week == 3 && add_status){
                    add_status = !(business_week[2] == 'X' && business_week[9] == 'X' && business_week[16] == 'X');
                    t1 = business_week[2]; t2 = business_week[9]; t3 = business_week[16];
                }else if(current_week == 4 && add_status){
                    add_status = !(business_week[3] == 'X' && business_week[10] == 'X' && business_week[17] == 'X');
                    t1 = business_week[3]; t2 = business_week[10]; t3 = business_week[17];
                }else if(current_week == 5 && add_status){
                    add_status = !(business_week[4] == 'X' && business_week[11] == 'X' && business_week[18] == 'X');
                    t1 = business_week[4]; t2 = business_week[11]; t3 = business_week[18];
                }else if(current_week == 6 && add_status){
                    add_status = !(business_week[5] == 'X' && business_week[12] == 'X' && business_week[19] == 'X');
                    t1 = business_week[5]; t2 = business_week[12]; t3 = business_week[19];
                }else if(current_week == 0 && add_status){
                    add_status = !(business_week[6] == 'X' && business_week[13] == 'X' && business_week[20] == 'X');
                    t1 = business_week[6]; t2 = business_week[13]; t3 = business_week[20];
                }

                if(add_status){
                    add_status = checkTimerOpen(t1, t2, t3, add_status);
                }
            }

            //設定背景顏色&過濾庫存
            var color_rule_count = adult_count + child_count;
            var adult_100p = 600;
            var child_100p = 200;
            var base_line = (adult_100p + child_100p) / 2;
            var color_style = '';

            if(show_adult_inventory === false && show_child_inventory === false){
                base_line = adult_100p + child_100p;
                color_rule_count = adult_count + child_count;
            }if(show_adult_inventory === true && show_child_inventory === true){
                if(adult_count > child_count){
                    base_line = child_100p;
                    color_rule_count = child_count;
                }else{
                    base_line = adult_100p;
                    color_rule_count = adult_count;
                }
            }else if(show_adult_inventory){
                base_line = child_100p;
                color_rule_count = adult_count;
            }else if(show_child_inventory){
                base_line = child_100p;
                color_rule_count = child_count;
            }

            if(color_rule_count >= (base_line/2)){
                color_style = 'inventory-hight';
                if(!show_inventory_hight){
                    add_status = false;
                }
            }else if(color_rule_count >= (base_line*0.2)){
                color_style = 'inventory-medium';
                if(!show_inventory_medium){
                    add_status = false;
                }
            }else if(color_rule_count > 0){
                color_style = 'inventory-low';
                if(!show_inventory_low){
                    add_status = false;
                }
            }else if(color_rule_count == 0){
                color_style = 'inventory-zero';
            }

            if(add_status){

                var more = '';
                if(stronghold.memo !== undefined){
                    var memo = $.trim(stronghold.memo);
                    if(memo.length > 0){
                        if(memo.indexOf('口罩') != -1 || memo.indexOf('號碼') != -1){ 
                            more = "購買規則<span class='fas fa-angle-right'></span>";
                        }
                    }
                }

                //設定 icon 所需寬度
                var icon_width = 100;
                var string_len = adult_count.toString().concat(child_count.toString()).length;
                if(inventory == "無庫存" && more == ''){
                    icon_width = 52;
                }else if(inventory == "無庫存" && more != ''){
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
                }

                var myIcon = L.divIcon({
                    popupAnchor: [0, -30],
                    iconAnchor: [(icon_width/2), 0],
                    iconSize:null,
                    html:'<div class="map-label"><div class="map-label-content ' + color_style + '">' + inventory + '<div class="map-label-content-more">' + more + '</div></div><div class="map-label-arrow"></div></div>'
                });
    
                var marker = L.marker([stronghold.lat, stronghold.lng], {
                    icon: myIcon,
                    title: stronghold.name,
                    alt: stronghold.name
                }).bindPopup(strongholdInfo(stronghold), {
                    minWidth: 210
                }).openTooltip()
                .on('popupopen', function (popup) {
                    $(".question_btn").click(function(event) {
                        showQuestionInfo();
                    });

                    $(".moreBusinessInfo").click(function () {
                        var $title = $(this).find(".title");
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

    $('#mask_inventory_last_update').text(mask_inventory_last_update.substr(5).replace(/-/g, "/"));
};

var calcLastTimeRange = function(timesData) {
    //如果時間格式是正確的，那下面這一步轉化時間格式就可以不用了
    var dateBegin = new Date(timesData.replace(/-/g, "/"));//將-轉化為/，使用new Date
    var dateEnd = new Date();//獲取當前時間
    var dateDiff = dateEnd.getTime() - dateBegin.getTime();//時間差的毫秒數
    var dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000));//計算出相差天數
    var leave1 = dateDiff % (24 * 3600 * 1000);    //計算天數後剩餘的毫秒數
    var hours = Math.floor(leave1 / (3600 * 1000));//計算出小時數
    //計算相差分鍾數
    var leave2 = leave1 % (3600 * 1000);    //計算小時數後剩餘的毫秒數
    var minutes = Math.floor(leave2 / (60 * 1000));//計算相差分鍾數
    //計算相差秒數
    var leave3 = leave2 % (60 * 1000);      //計算分鍾數後剩餘的毫秒數
    var seconds = Math.round(leave3 / 1000);
    var timesString = '';

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