var default_lat = 25.0315785;
var default_lng = 121.4427123;

function initMap() {

    // 先確認使用者裝置能不能抓地點
    if (navigator.geolocation) {

        // 使用者不提供權限，或是發生其它錯誤
        function error() {
            alert('無法取得你的位置');
        }

        // 跟使用者拿所在位置
        navigator.geolocation.getCurrentPosition(function (position) {
            default_lat = position.coords.latitude;
            default_lng = position.coords.longitude;
            createMap();
        });
    } else {
        //alert('Sorry, 你的裝置不支援定位功能。')
        createMap();
    }
}

function createMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: {
            lat: default_lat,
            lng: default_lng
        }
    });

    var infoWin = new google.maps.InfoWindow();
    var markers = locations.map(function (location, i) {

        var marker = new google.maps.Marker({
            position: location
        });
        google.maps.event.addListener(marker, 'click', function (evt) {
            name = "<b>" + location.name + "</b><br />";
            maskInventory = getMaskInventory(location.id);
            infoWin.setContent(name + location.info + maskInventory);
            infoWin.open(map, marker);
        })
        return marker;
    });

    var markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
}

function getMaskInventory(id){
    return "";
    inventoryResult = "<br /><br /><b>口罩剩餘數量(測試中,假資料)</b><br />";

    $.ajax({
        url: "data/"+id+".txt",
        type: 'get',
        async: false,
        success: function (response) {
            result_array = result.split(",");
            inventoryResult += "成人口罩: " + result_array[4] + ", 兒童口罩: " + result_array[5] + "<br />來源資料時間: " + result_array[6];   
        },
        error: function (xhr) {
            inventoryResult += "資料取得失敗";
        }
    });
    return inventoryResult;
}