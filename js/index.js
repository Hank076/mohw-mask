$(function() {
    
    $("#info").click(function(event) {
        showInfoMessage();
    });

    $("#filter").click(function(event) {
        $(".filter_ctl").attr('disabled', true);

        dont_show_null_inventory = $("#dont_show_null_inventory").is(":checked");
        dont_show_no_open = $("#dont_show_no_open").is(":checked");
        var type = $("input[name='type']:checked").val();

        if(type == '0'){
            //不過濾
            show_adult_inventory = false;
            show_child_inventory = false;

        }else if(type == '1'){
            //只顯示成人 > 0
            show_adult_inventory = true;
            show_child_inventory = false;

        }else if(type == '2'){
            //只顯示兒童 > 0
            show_adult_inventory = false;
            show_child_inventory = true;
            
        }else if(type == '3'){
            //顯示成人+兒童 > 0
            show_adult_inventory = true;
            show_child_inventory = true;
        }

        //清除 markers
        markers.clearLayers();

        //更新地圖
        createStrongholdData();

        $(".filter_ctl").attr('disabled', false);
    });

    var clock = setInterval(reloadStrongholdData , 60000);
});

function showInfoMessage(){
    $.alert({
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'green',
        title: '提醒',
        content: '❕部分藥局因採發放號碼牌方式，方便民眾購買口罩，系統目前無法顯示已發送號碼牌數量。<br /><br />❕口罩數量以藥局實際存量為主，線上查詢之數量僅供參考。',
        backgroundDismiss: true
    });
}

function showWarningMessage(){
    $.alert({
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'red',
        title: '緊急通知',
        content: '如果你曾於1/31前往北北基地區幾個重要景點，例如基隆廟口、九份、台北101、西門町等，請進行自主健康管理，並留意個人是否有發燒或呼吸道症狀。<br />詳細地點：<a target="_blank" href="http://bit.ly/2SpSxeT">http://bit.ly/2SpSxeT</a>'
    });
}

function showUpdateHistory(){
    $.alert({
        icon: 'fa fa-check',
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'blue',
        title: '系統更新',
        content: '地圖現在會隱藏今天未營業&無庫存的藥局囉！(可到右上角取消)',
        autoClose:'ok|2000',
        backgroundDismiss: true
    });
}

function showUpdateProcess(){
    var jc = $.dialog({
        icon: 'fa fa-spinner fa-spin',
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'orange',
        title: '資料更新中',
        content: '正在抓取最新診所&口罩庫存資訊...',
        onOpen: function(){
            reloadStrongholdData();
            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();
        }
    });
}


function showVersionHistory(){
    var jc = $.alert({
        icon: 'fas fa-list-alt',
        columnClass: 'col-md-6 col-md-offset-3',
        animation: 'top',
        closeAnimation: 'bottom',
        type: 'orange',
        title: '版本資訊',
        content: '<table class="table table-bordered table-condensed table-striped"><tr><th>日期</th><th>更新內容</th></tr>' +
        '<tr><td>2020/02/16</td><td>調整風格樣式<br />即刻起每分鐘自動抓取並呈現最新數據<br />圖資改用國土繪測中心圖資<br />調整營業時間過濾為當前之後當天無營業的據點<br />重新定位時抓取最新位置</td></tr>' +
        '<tr><td>2020/02/15</td><td>調整工具按鈕樣式<br /></td></tr>' +
        '<tr><td>2020/02/14</td><td>調整FB按讚按鈕</td></tr>' +
        '<tr><td>2020/02/14</td><td>調整 marker 樣式<br />即刻起販售據點全自動更新</td></tr>' +
        '<tr><td>2020/02/12</td><td>將有備註口罩領取資訊的藥局特別在地圖上標示出來</td></tr>' +
        '<tr><td>2020/02/10</td><td>新增返回自己位置的按紐<br>優化過濾及搜尋功能<br />網址更換<br />新增過濾無營業的藥局</td></tr>' +
        '<tr><td>2020/02/09</td><td>新增過濾及搜尋功能<br />圖資改用CARTO</td></tr>' +
        '<tr><td>2020/02/08</td><td>直接於地圖上直覺顯示口罩剩餘數量<br />圖資從 Google Map 改為 OpenStreeMap</td></tr>' +
        '<tr><td>2020/02/07</td><td>新增緊急通知訊息<br / >新增顯示自己目前的位置</td></tr>' +
        '<tr><td>2020/02/06</td><td>加速口罩庫存更新頻率<br />人工校正衛服部錯誤資料<br />程式優化</td></tr>' +
        '<tr><td>2020/02/05</td><td>新增口罩庫存資訊</td></tr>' +
        '<tr><td>2020/02/04~06</td><td>網站上線<br />提供新北市新莊區資料<br />提供新北市全區資料<br />提供台北市全區資料<br />開始提供全國資料!!</td></tr>' +
        '</table>',
        backgroundDismiss: true
    });
}