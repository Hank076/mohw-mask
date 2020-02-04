function initMap() {
            
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: {lat: 25.0315785, lng: 121.4427123}
    });

    var infoWin = new google.maps.InfoWindow();
    var markers = locations.map(function (location, i) {

        var marker = new google.maps.Marker({
            position: location,
            label: location.name
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