var bShowWarningMessage = true;
var warningDateline = 20210629;
var fullDate = new Date();
var yyyy = fullDate.getFullYear();
var MM = (fullDate.getMonth() + 1) >= 10 ? (fullDate.getMonth() + 1) : (fullDate.getMonth() + 1);
var dd = fullDate.getDate() < 10 ? ("0"+fullDate.getDate()) : fullDate.getDate();
var today = (yyyy * 10000) + (MM * 100) + parseInt(dd);

if(today > warningDateline){
    bShowWarningMessage = false;
}

$(function() {
    $("#info").click(function(event) {
        showInfoMessage();
    });

    $("#filter").click(function(event) {
        $(".filter_ctl").attr('disabled', true);
        updateFilterOption();
        showUpdateProcessByManual();
    });

    var clock = setInterval(function() {updateFilterOption();reloadStrongholdData(true);} , 120000);
});

var updateFilterOption = function(){
    dont_show_no_open = $("#dont_show_no_open").is(":checked");
    show_inventory_zero = $("#inventory_zero").is(":checked");

    let type = $("input[name='type']:checked").val();

    if(type == '0'){
        //不過濾
        show_all_inventory = true;
        show_adult_inventory = false;
        show_child_inventory = false;
        show_test_kit_inventory = false;

    }else if(type == '1'){
        //只顯示成人 > 0
        show_all_inventory = false;
        show_adult_inventory = true;
        show_child_inventory = false;
        show_test_kit_inventory = false;

    }else if(type == '2'){
        //只顯示兒童 > 0
        show_all_inventory = false;
        show_adult_inventory = false;
        show_child_inventory = true;
        show_test_kit_inventory = false;

    }else if(type == '3'){
        //顯示成人+兒童 > 0
        show_all_inventory = false;
        show_adult_inventory = true;
        show_child_inventory = true;
        show_test_kit_inventory = false;

    }else if(type == '4'){
        //顯示快篩試劑
        show_all_inventory = false;
        show_adult_inventory = false;
        show_child_inventory = false;
        show_test_kit_inventory = true;
    }
}

var showUpdateProcessByManual = function(){   
    var jc = $.dialog({
        icon: 'fa fa-spinner fa-spin',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '資料過濾中',
        content: '正在過濾庫存資訊...',
        onOpen: function(){
            var type = $("input[name='type']:checked").val();
            var ga_event_label = '';
    
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
            }
    
            gtag('event', 'click', {
                'event_category': '搜尋工具',
                'event_label': ga_event_label
            });
    
            //清除 markers
            markers.clearLayers();
    
            //更新地圖
            createStrongholdData();

            $(".filter_ctl").attr('disabled', false);

            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();
        }
    });
};

var showVersionHistory = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '網站歷程'
    });

    $.alert({
        icon: 'fas fa-list-alt',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-6 col-md-offset-3',
        type: 'green',
        title: '版本資訊',
        content: '<table class="table table-bordered table-condensed table-striped"><tr><th>版本</th><th>歷程</th></tr>' +
        '<tr><td>05/03</td><td>新增快篩試劑數量，調整網站</td></tr>' +
        '<tr><td>12/10</td><td>新增公告</td></tr>' +
        '<tr><td>05/03</td><td>新增緊急公告</td></tr>' +
        '<tr><td>04/28</td><td>新增緊急公告</td></tr>' +
        '<tr><td>02/01</td><td>新增緊急公告</td></tr>' +
        '<tr><td>01/20</td><td>新增緊急公告</td></tr>' +
        '<tr><td>12/22</td><td>新增緊急公告</td></tr>' +
        '<tr><td>04/20</td><td>新增緊急公告</td></tr>' +
        '<tr><td>04/16</td><td>衛服部無預警更新資料格式，緊急配合調整</td></tr>' +
        '<tr><td>04/15</td><td>新增公告</td></tr>' +
        '<tr><td>04/08</td><td>新增公告</td></tr>' +
        '<tr><td>03/30</td><td>新增公告</td></tr>' +
        '<tr><td>03/23</td><td>新增公告</td></tr>' +
        '<tr><td>03/19</td><td>新增公告</td></tr>' +
        '<tr><td>03/17</td><td>新增公告</td></tr>' +
        '<tr><td>03/14</td><td>新增防詐騙公告</td></tr>' +
        '<tr><td>03/13</td><td>衛服部公告庫存資料改為三分鐘更新一次</td></tr>' +
        '<tr><td>03/12</td><td>因應衛服部庫存系統不穩定新增公告及程式應變處理</td></tr>' +
        '<tr><td>03/10</td><td>新增口罩實名制2.0相關規則公告</td></tr>' +
        '<tr><td>03/06</td><td>調整 Facebook SDK 問題</td></tr>' +
        '<tr><td>03/05</td><td>新增口罩數量分級搜尋功能</td></tr>' +
        '<tr><td>03/04</td><td>新增剩餘口罩數量顏色<br />優化圖標的呈現方式</td></tr>' +
        '<tr><td>03/02</td><td>新增大人小孩口罩最後新增減少時間(於詳細資訊點擊回報時間出現)<br />新增領取數量異動公告</td></tr>' +
        '<tr><td>02/29</td><td>新增口罩庫存最後回報時間(於藥局詳細資訊內)<br />新增重要公告</td></tr>' +
        '<tr><td>02/22</td><td>稍微加快讀取速度</td></tr>' +
        '<tr><td>02/21</td><td>新增北市健康服務中心據點<br />新增衛生所的營業時間與公告</td></tr>' +
        '<tr><td>02/20</td><td>調整程式載入順序及新增資訊錯誤排解說明<br />調整搜尋提示＆新增疾管署粉絲團訊息</td></tr>' +
        '<tr><td>02/17</td><td>新增網站版本歷程</td></tr>' +
        '<tr><td>02/16</td><td>版面微調<br />即刻起每分鐘自動抓取並呈現最新數據<br />圖資改用國土測繪中心圖資<br />Facebook 新增分享按鈕<br />調整無營業時間過濾規則為: 當天當下時間之後無營業<br />重新定位時抓取最新位置</td></tr>' +
        '<tr><td>02/15</td><td>版面微調<br />調整地圖工具按鈕樣式</td></tr>' +
        '<tr><td>02/14</td><td>調整 Facebook 按讚按鈕<br />調整地圖上藥局重疊時的呈現方式<br />即刻起食衛署配合藥局清單全自動更新<br />人工校正衛服部錯誤資料</td></tr>' +
        '<tr><td>02/13</td><td>更新食衛署配合藥局清單</td></tr>' +
        '<tr><td>02/12</td><td>更新食衛署配合藥局清單<br />將有備註口罩領取資訊的藥局特別在地圖上標示出來<br />新增新版本功能提示訊息</td></tr>' +
        '<tr><td>02/11</td><td>更新食衛署配合藥局清單</td></tr>' +
        '<tr><td>02/10</td><td>更新食衛署配合藥局清單<br />新增返回自己位置的按紐<br />網址更換<br />新增 Facebook 按讚按鈕<br />新增過濾無營業的藥局</td></tr>' +
        '<tr><td>02/09</td><td>更新食衛署配合藥局清單<br />圖資改用 Carto<br />新增搜尋功能<br />優化訊息呈現方式</td></tr>' +
        '<tr><td>02/08</td><td>更新食衛署配合藥局清單<br />直接於地圖上直覺顯示口罩剩餘數量<br />圖資從 Google Map 改為 OpenStreeMap<br />2/07<br />更新食衛署配合藥局清單<br />新增緊急通知功能<br />人工校正衛服部錯誤資料<br />新增標記自己目前的位置<br />版面微調<br />新增顯示藥局營業時間<br /></td></tr>' +
        '<tr><td>02/06</td><td>更新食衛署配合藥局清單<br />版面微調<br />加速口罩庫存更新頻率<br />新增自動顯示自己附近的地圖<br />人工校正衛服部錯誤資料<br />直接於地圖上直覺顯示口罩剩餘數量</td></tr>' +
        '<tr><td>02/05</td><td>新增口罩庫存資訊<br />人工校正衛服部錯誤資料<br />資料來源改為食衛署確定有配合的藥局</td></tr>' +
        '<tr><td>02/04</td><td>提供全國藥局資料<br />提供台北市全區藥局資料<br />提供新北市全區藥局資料<br />提供新北市新莊區藥局資料<br />網站上線</td></tr>' +
        '</table>',
        backgroundDismiss: true
    });
};

var showTwcdcFB = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '疾管署粉絲團'
    });
    
    var jc = $.dialog({
        icon: 'fa fa-clinic-medical',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '疾病管制署 - 粉絲團',
        content: '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FTWCDC&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId=544411143087055" width="340" height="500" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>',
        backgroundDismiss: true
    });
};

var showInfoMessage = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '提醒資訊'
    });
    $.alert({
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-6 col-md-offset-3',
        type: 'blue',
        title: '資訊',
        content: 
        '部分藥局採發放號碼牌方式購買，故系統無法得知已發送號碼牌的數量。<br />' + 
        '口罩/快篩存量以現場存量為主，線上查詢數量僅供參考。<br /><br />' + 
        '網頁會定時自動更新庫存，不用重新整理。<br />' + 
        '全民抗疫，請保持耐心與禮貌哦！<br /><br />' + 
        '🔔<a target="_blank" href="https://www.cdc.gov.tw/Category/Page/R8bAd_yiVi22CIr73qM2yw">請安裝臺灣社交距離App</a><br /><br />' +
        '🔔<a target="_blank" href="https://antiflu.cdc.gov.tw/ExaminationCounter">COVID-19全國指定社區採檢院所地圖</a><br /><br />',
        backgroundDismiss: true
    });
};

//緊急發布用, 可藉由定時器自動關閉
var showWarningMessage = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '重要訊息'
    });
    $.alert({
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-6 col-md-offset-3',
        type: 'red',
        title: '緊急通知',
        content: 
        '🔔全國疫情警戒第三級延長至6月28日止<br /><br />' + 
        '若有不適，請撥打1922防疫專線，就醫時主動告知活動暴露史。<br />' +
        '搭乘大眾運輸時，應全程配戴口罩並配合量測體溫，<br />' + 
        '若身體不適請戴口罩速就醫，主動告知旅遊、接觸史等，並落實生病在家休息。<br /><br />' + 
        '<a target="_blank" href="https://www.facebook.com/TWCDC/photos/a.187029023406/10159131395593407/"><img src="https://scontent.ftpe8-2.fna.fbcdn.net/v/t1.6435-9/191725964_10159131395598407_2133671331429041913_n.jpg?_nc_cat=101&ccb=1-3&_nc_sid=730e14&_nc_ohc=jvHM7sDRuXUAX9TRjkH&_nc_ht=scontent.ftpe8-2.fna&oh=8efc23b962e6bf87c65f9a653e30311a&oe=60CAAE84" /></a>',
    });
};

// showWarningMessage > showTopMessage (有 Warning 就不會跳 Top)
var showTopMessage = function(){
    $.alert({
        icon: 'fa fa-check',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'blue',
        title: '重要通知',
        content: 
        '🔔即日起取消實聯制，現行戴口罩等防疫措施維持至111年5月31日<br /><br />' + 
        '🔔網站預設只顯示快篩試劑販售點，如要顯示口罩資訊可由右上角選擇<br /><br />' + 
        '<a target="_blank" href="https://www.cdc.gov.tw/Category/Page/R8bAd_yiVi22CIr73qM2yw">🔔請安裝臺灣社交距離App。</a><br /><br />' +
        '本網站會自動更新庫存，不用重新整理。<br />' + 
        '全民抗疫，請保持耐心與禮貌哦！',
        autoClose:'ok|10000',
        backgroundDismiss: true
    });
};

var showUpdateProcess = function(){
    gtag('event', 'click', {
        'event_category': '地圖工具',
        'event_label': '更新地圖'
    });
    
    var jc = $.dialog({
        icon: 'fa fa-spinner fa-spin',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '資料更新中',
        content: '正在抓取最新庫存資訊...',
        onOpen: function(){
            reloadStrongholdData(false);
            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();
        }
    });
};

var showQuestionInfo = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '資訊有誤怎麼辦'
    });

    $.alert({
        icon: 'fa fa-question-circle',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-6 col-md-offset-3',
        type: 'green',
        title: '資訊有誤嗎',
        content: '如果藥局的庫存或者備註有誤，可以禮貌提醒藥師確認系統資料' + 
        '<BR /><BR />●庫存的部分<br>' +
        '可請藥師瀏覽『<a target="_blank" href="http://ws.nhi.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvMjkyL2NrZmlsZS9mYmUzNWVmZC0zMDkyLTRjNWEtOTAyZi0zMDIxN2I0YzYyMWQucGRm&n=MTA5MDIwNiBVc2VyR3VpZGVfUVA1X3YzLjAucGRm&icon=.pdf">於防疫口罩管控系統VPN登錄作業使用者手冊</a>』的第五頁，<BR />有說明負數的操作方式。' +
        '<BR /><BR />●備註的部分<br>' +
        '可請藥師一樣連線至VPN後進入「<a target="_blank" href="http://bit.ly/2ScrpB6">看診資料及掛號費</a>」：(1)每日固定看診時段(2)「固定看診時段備註欄」，可修正藥局販賣口罩起迄時間及相關欲通知民眾事項。',
        backgroundDismiss: true
    });
};

var buy_mask = function(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '口罩預購'
    });
};