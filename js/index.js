$(function() {
    
    $("#info").click(function(event) {
        showInfoMessage();
    });

    $("#filter").click(function(event) {
        $(".filter_ctl").attr('disabled', true);
        showUpdateProcessByManual();
    });

    var clock = setInterval(function() {reloadStrongholdData(true);} , 60000);
});

function showUpdateProcessByManual(){   
    var jc = $.dialog({
        icon: 'fa fa-spinner fa-spin',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'orange',
        title: '資料過濾中',
        content: '正在過濾相關診所&口罩庫存資訊...',
        onOpen: function(){

            dont_show_null_inventory = $("#dont_show_null_inventory").is(":checked");
            dont_show_no_open = $("#dont_show_no_open").is(":checked");
            var type = $("input[name='type']:checked").val();
            var ga_event_label = '';
    
            if(dont_show_null_inventory){
                ga_event_label += '有庫存, ';
            }else{
                ga_event_label += '不論庫存, ';
            }
    
            if(dont_show_no_open){
                ga_event_label += '有營業, ';
            }else{
                ga_event_label += '不論營業, ';
            }
    
            if(type == '0'){
                //不過濾
                show_adult_inventory = false;
                show_child_inventory = false;
                ga_event_label += '所有';
    
            }else if(type == '1'){
                //只顯示成人 > 0
                show_adult_inventory = true;
                show_child_inventory = false;
                ga_event_label += '僅成人';
    
            }else if(type == '2'){
                //只顯示兒童 > 0
                show_adult_inventory = false;
                show_child_inventory = true;
                ga_event_label += '僅兒童';
    
            }else if(type == '3'){
                //顯示成人+兒童 > 0
                show_adult_inventory = true;
                show_child_inventory = true;
                ga_event_label += '成人與兒童';
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
}

function showVersionHistory(){
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
        //'<tr><td>02/28</td><td>新增口罩庫存最後回報時間(藥局詳細資訊內)</td></tr>' +
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
}

function showTwcdcFB(){
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
}

function showQuestionInfo(){
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
        '可請藥師一樣連線至VPN後進入「看診資料及掛號費」：(1)每日固定看診時段(2)「固定看診時段備註欄」，可修正藥局販賣口罩起迄時間及相關欲通知民眾事項。',
        backgroundDismiss: true
    });
}

function showInfoMessage(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '提醒資訊'
    });
    $.alert({
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-6 col-md-offset-3',
        type: 'blue',
        title: '提醒',
        content: '❕部分藥局因採發放號碼牌方式，方便民眾購買口罩，系統目前無法顯示已發送號碼牌數量。<br /><br />❕口罩數量以藥局實際存量為主，線上查詢之數量僅供參考。<br /><br />❕全民抗疫，請保持耐心與禮貌哦。<br />' +
        '<br /><a target="_blank" href="https://www.facebook.com/TWCDC/posts/10157875518563407"><img src="https://scontent.ftpe8-3.fna.fbcdn.net/v/t1.0-9/p960x960/88101392_10157875518523407_8749554612014415872_o.png?_nc_cat=1&_nc_ohc=l9qWPxpPJVAAX-1vkU4&_nc_ht=scontent.ftpe8-3.fna&oh=9e2552c0a186e22bd5f3e91519dd299b&oe=5EB6EBFC" /></a>',
        backgroundDismiss: true
    });
}

function showWarningMessage(){
    gtag('event', 'click', {
        'event_category': '提醒工具',
        'event_label': '重要訊息'
    });
    $.alert({
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-8 col-md-offset-2',
        type: 'red',
        title: '重要通知',
        content: '嚴重特殊傳染性肺炎（COVID-19）防治及紓困振興特別條例<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FTWCDC%2Fposts%2F10157875934988407&width=350&show_text=true&appId=544411143087055&height=622" width="350" height="622" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>'
    });
}

function showUpdateHistory(){
    $.alert({
        icon: 'fa fa-check',
        animation: 'top',
        closeAnimation: 'bottom',
        columnClass: 'col-md-4 col-md-offset-4',
        type: 'blue',
        title: '系統更新',
        content: '2月27日起不限單雙號可買兒童口罩，每次最多持3張兒童健保卡代購！<br /><br />系統每分鐘自動與衛服部更新庫存。<br /><br />全民抗疫，請保持耐心與禮貌哦！<br /><br />詳請請點選地圖右下角的 <i class="fas fa-info"></i> 按鈕了解',
        autoClose:'ok|5000',
        backgroundDismiss: true
    });
}

function showUpdateProcess(){
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
        content: '正在抓取最新診所&口罩庫存資訊...',
        onOpen: function(){
            reloadStrongholdData(false);
            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();
        }
    });
}