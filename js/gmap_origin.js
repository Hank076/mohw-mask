var default_lat = 25.0315785;
var default_lng = 121.4427123;
var getUserLocation = false;
var mask_inventory = [];

function initMap() {
    loadMaskInventory(); //取得口罩剩餘數量

    // 先確認使用者裝置能不能抓地點
    if (navigator.geolocation) {
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        function success(pos) {
            getUserLocation = true;
            var crd = pos.coords;
            default_lat = crd.latitude;
            default_lng = crd.longitude;
            createMap();
        };

        function error(err) {
            createMap();
        };

        // 跟使用者拿所在位置
        navigator.geolocation.getCurrentPosition(success, error, options);

    } else {
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
        var marker;
        var inventory = "";
        var icon = "";
        //icon: "https://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bb|" + inventory + "|FFFFFF|000000",

        if(mask_inventory[location.id] !== undefined){
            inventory = mask_inventory[location.id];
            inventoryCount = parseInt(inventory[0]) + parseInt(inventory[1]);

            if(inventoryCount > 0){
                inventory = "口罩剩：" + inventoryCount;
            }else{
                inventory = "口罩沒了";
            }

            marker = new google.maps.Marker({
                position: location,
                icon: "https://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=edge_bc|" + inventory + "|FFFFFF|000000"
            });

        }else{
            marker = new google.maps.Marker({
                position: location,
                title: "尚無口罩庫存資訊"
            });
        }
        
        google.maps.event.addListener(marker, 'click', function (evt) {
            name = "<b>" + location.name + "</b>";
            info = "<br />" + location.info;
            maskInventory = getMaskInventory(location.id);

            memo = "";
            opentime = "";
            if(location.w11 != 'NA'){
                opentime = "<br/><br/><b>營業資訊(O:營業, X:無營業, 空白:未知)</b>";
                opentime += "<br/><table class=\"tg\"><tr><th class=\"tg-lboi\"></th><th class=\"tg-lboi\">一</th><th class=\"tg-lboi\">二</th><th class=\"tg-lboi\">三</th><th class=\"tg-lboi\">四</th><th class=\"tg-lboi\">五</th><th class=\"tg-cly1\">六</th><th class=\"tg-0lax\">日</th></tr><tr><td class=\"tg-lboi\">上</td><td class=\"tg-lboi\">" + location.w11 + "</td><td class=\"tg-lboi\">" + location.w21 + "</td><td class=\"tg-lboi\">" + location.w31 + "</td><td class=\"tg-lboi\">" + location.w41 + "</td><td class=\"tg-lboi\">" + location.w51 + "</td><td class=\"tg-gg7l\">" + location.w61 + "</td><td class=\"tg-kftd\">" + location.w71 + "</td></tr><tr><td class=\"tg-lboi\">下</td><td class=\"tg-lboi\">" + location.w12 + "</td><td class=\"tg-lboi\">" + location.w22 + "</td><td class=\"tg-lboi\">" + location.w32 + "</td><td class=\"tg-lboi\">" + location.w42 + "</td><td class=\"tg-lboi\">" + location.w52 + "</td><td class=\"tg-gg7l\">" + location.w62 + "</td><td class=\"tg-kftd\">" + location.w72 + "</td></tr><tr><td class=\"tg-0pky\">晚</td><td class=\"tg-0pky\">" + location.w13 + "</td><td class=\"tg-0pky\">" + location.w23 + "</td><td class=\"tg-0pky\">" + location.w33 + "</td><td class=\"tg-0pky\">" + location.w43 + "</td><td class=\"tg-0pky\">" + location.w53 + "</td><td class=\"tg-kftd\">" + location.w63 + "</td><td class=\"tg-kftd\">" + location.w73 + "</td></tr></table>";
            }
            
            if($.trim(memo).length > 0){
                memo = "<br />備註：" + location.memo;
            }

            infoWin.setContent(name + info + maskInventory + opentime + memo);
            infoWin.open(map, marker);
        });
        return marker;
    });

    if(getUserLocation){
        var marker = new google.maps.Marker({
            position: {lat: default_lat, lng: default_lng},
            map: map,
            label: "我"
        });
    }

    var markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
}