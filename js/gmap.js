var default_lat = 25.0315785;
var default_lng = 121.4427123;

function initMap() {

    // 先確認使用者裝置能不能抓地點
    if (navigator.geolocation) {

        // 使用者不提供權限，或是發生其它錯誤
        function error() {
            alert('無法取得你的位置');
        }

        // 使用者允許抓目前位置，回傳經緯度
        function success(position) {
            console.log(position.coords.latitude, position.coords.longitude);
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
            infoWin.setContent(location.info);
            infoWin.open(map, marker);
        })
        return marker;
    });
    
    var markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
}