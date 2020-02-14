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
});

function showInfoMessage(){
    $.alert({
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'green',
        title: '提醒',
        content: '❕部分藥局因採發放號碼牌方式，方便民眾購買口罩，系統目前無法顯示已發送號碼牌數量。<br /><br />❕口罩數量以藥局實際存量為主，線上查詢之數量僅供參考。'
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
        content: '部分藥局已在備註內新增口罩領取時間囉！',
        autoClose:'ok|2000'
    });
}

function showUpdateProcess(){
    var jc = $.alert({
        icon: 'fa fa-spinner fa-spin',
        useBootstrap: false,
        animation: 'top',
        closeAnimation: 'bottom',
        boxWidth: '20em',
        type: 'orange',
        title: '資料更新中',
        content: '正在抓取最新診所&口罩庫存資訊...',
        onOpen: function(){
            markers.clearLayers(); //清除 markers
            loadMaskInventory(false); //取得口罩剩餘數量
            createStrongholdData(); //更新地圖
            jc.setIcon('fas fa-check');
            jc.setType('green');
            jc.close();
        }
    });
}