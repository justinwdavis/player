var PlayerMedia = {
  trackList : [
    {
        "id" : 1,
        "name" : "Track 1", 
        "artist" : "LSD Soundsystem", 
        "duration" : "8:57",
        "url" : "./music/01.mp3"
    },
    {
        "id" : 2,
        "name" : "Track 2",
        "artist" : "Binpack",
        "duration" : "4:17",
        "url" : "./music/02_.mp3"
    },
    {
        "id" : 3,
        "name" : "Track 3",
        "artist" : "Bavid Dyrne",
        "duration" : "3:50",
        "url" : "./music/03.mp3"
    }
   ]    
};


var Player = (function (){
    var nativeAudio = false,
            _currentlyPlaying = false,
            _currentlyPlayingId = null,
            _currentlyPlayingDuration = 0,
            _scrubWidth = $(".scrubber").width(),
            _initalTrackId = 0,
            _selectedTrackId = _initalTrackId,
            _trackListLength = PlayerMedia.trackList.length,
            _selectedClassName = "current",
            _nastyOldEvents = [],
            _flickr = false,
            _theme = "dark";

    function _init() {
        if(nativeAudio) {
            // use HTML5 audio

        } else {
            // use external library
            soundManager.url = './swf/soundmanager2.swf';
            soundManager.onready(function() {
                // check if SM2 successfully loaded..
                if (soundManager.supported()) {
                    _createSoundObjects();
                }
            });
        }
        _toggleTheme();
        _createTrackList();
        _attachTrackEvent();
        _updateTrackName();
    }

    function _toggleTheme() {
        $("body").removeAttr("class");
        $("body").attr("class", _theme);
    }

    function _createTrackList(){
        var string = '<ul id="playlist">';

        for (var i=0; i < _trackListLength; i++) {
            var zebraStripe = ( i % 2 === 0 ) ? "even" : "odd";
            string += '<li id="track_' + i + '" class="' + zebraStripe;
            // set select class on first playing track
            if( i === _initalTrackId ) { string += " " + _selectedClassName; }
            string +=  '">';

            string += '<a class="playlist-ctrl" id="play_' + i + '" >' +
                    PlayerMedia.trackList[i].name +
                    '<span>' + PlayerMedia.trackList[i].duration + '</span>' +
                    '</a></li>';
        }
        string += '</ul>';
        $("#playlist-target").html(string);
        console.info(string);
        var song_count = (_trackListLength > 1) ? _trackListLength + " Songs" : _trackListLength + " Song";
        $("#playlist-count-target").html(song_count);
    }

    function _createSoundObjects(){
        for (var i = 0; i < _trackListLength; i++) {
            var track = PlayerMedia.trackList[i];
            track.soundObject = soundManager.createSound({
                id:  "sound_" + track.id,
                url: track.url,
                stream: true,
                autoplay: false,
                whileloading: _loading,
                onload: _loaded,
                whileplaying: _playing,
                multiShot: false,
                onfinish: _next
            });
        }
    }

    function _attachTrackEvent(){
        $("#playlist").bind('click', _trackEventHandler);
        $(".play-button").bind('click', _play);
        $(".prev_button").bind('click', _prev);
        $(".next_button").bind('click', _next);
    }


    function _convertDuration(duration) {
        duration = Math.floor(duration/60);
        return duration;
    }

    function _trackEventHandler(event) {
        //Event.stop(event);
        var id = event.target.id;

        $(id).attr("class", "turn");
        if(id.match(/^play*/g)) {
            id = id.split("_");
            id = parseInt(id[1], 10);
            _play(id);
        }
    }

    function _play(id){
        id = (id.target && id.target.id == "play-button") ? _currentlyPlayingId || _initalTrackId : id;

        var media = PlayerMedia.trackList[id].soundObject;

        var currentlyPlayingId = (_currentlyPlayingId === 0) ? true : _currentlyPlayingId;
        if(_currentlyPlaying && currentlyPlayingId && id !== _currentlyPlayingId) {
            PlayerMedia.trackList[_currentlyPlayingId].soundObject.stop();
            //PlayerMedia.trackList[_currentlyPlayingId].soundObject.stopAll();
            //PlayerMedia.trackList[_currentlyPlayingId].soundObject.unload();
        }

        _currentlyPlaying = true;
        _currentlyPlayingId = id;
        _selectedTrackId = id;
        _highLightTrack();

        if(media === 0){
            $(".play-button").addClass("toggle_pause_button");
            media.play();
        } else {
            if(media.paused) {
                $(".play-button").html(">");
                $(".play-button").addClass("toggle_pause_button");
            } else {
                $(".play-button").html(">");
                $(".play-button").removeClass("toggle_pause_button");
            }
            media.togglePause();
        }

        // better, but still not perfect. Need to unbind these _nastyOldEvents
        var event = $(".scrubber").click(_scrubber);
        _nastyOldEvents.push(event);

        if(_flickr) {
            _getArtistImage(PlayerMedia.trackList[_currentlyPlayingId].artist);
        }
    }

    function _prev(){
        var currentlyPlayingId = (_currentlyPlayingId === 0) ? true : _currentlyPlayingId;
        if(_selectedTrackId > 0) {
            _selectedTrackId--;
        } else {
            _selectedTrackId = (_trackListLength - 1);
        }

        if(_currentlyPlaying && currentlyPlayingId) {
            //_highLightTrack();
            _playPrev();
        } else {
            _highLightTrack();
        }
    }

    function _next(){
        var currentlyPlayingId = (_currentlyPlayingId === 0) ? true : _currentlyPlayingId;
        if(_selectedTrackId < (_trackListLength - 1)) {
            _selectedTrackId++;
        } else {
            _selectedTrackId = 0;
        }

        if(currentlyPlayingId && _currentlyPlaying) {
            //_highLightTrack();
            _playNext();
        } else {
            _highLightTrack();
        }
    }

    function _playNext() {
        var next = _currentlyPlayingId + 1;
        if(next < _trackListLength) {
            _play(next);
        } else {
            _play(0);
        }
    }

    function _playPrev() {
        var prev = _currentlyPlayingId - 1;
        if(prev >= 0) {
            _play(prev);
        } else {
            _play(_trackListLength - 1);
        }
    }

    function _updateTrackName() {
        var ele = document.getElementById("artist-track-target");
        ele.innerHTML = PlayerMedia.trackList[_selectedTrackId].artist +
                " - " + PlayerMedia.trackList[_selectedTrackId].name;
    }


    function _highLightTrack(){
        var currentEle = document.getElementById("track_" + _selectedTrackId);
        var currentClass = currentEle.getAttribute("class");
        var altClass = (currentClass === "even") ? "odd" : "even";
        var aListItems = document.getElementById("playlist").getElementsByTagName('LI');

        _updateTrackName();

        for(var key in aListItems){
            if (typeof aListItems[key] === "object") {
                var aClasses = aListItems[key].getAttribute("class").split(" ");
                aListItems[key].setAttribute("class", aClasses[0]);
            }
        }

        currentEle.setAttribute("class", currentClass + " " + _selectedClassName);
    }

    function _loading() {
        var percentage = Math.floor(this.bytesLoaded / this.bytesTotal * 100);
        $(".loading-target").css({ width : percentage + "%"});
    }

    function _loaded() {
        $(".loading-target").css({ width : "0%"})
    }

    function _playing() {

        $(".play-button").html("||"); //addClassName("toggle_pause_button");
        _currentlyPlayingDuration = this.durationEstimate;
        // something bad could happen here
        var percentage = Math.floor((this.position / _currentlyPlayingDuration) * 100);
        $(".scrub-target").css({ width : percentage + "%"});

        // bad news here...ask me why
        //var event = $(".scrubber").click(_scrubber);
        //_nastyOldEvents.push(event);
    }

    function _scrubber(ev) {
        var pos;
        if(_scrubWidth < 1) {
            pos = 0;
        } else {
            pos = ev.offsetX * (_currentlyPlayingDuration/_scrubWidth);
        }

        PlayerMedia.trackList[_currentlyPlayingId].soundObject.setPosition(pos);
    }

    function _getArtistImage(artist) {
      $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
      {
        tags: artist,
        tagmode: "any",
        format: "json"
      },
      function(data) {
        console.info(data);
        $.each(data.items, function(i,item){
          var img = item.media.m;
          window.setTimeout(function(){
             $('body').css('background-image', 'url("' + img + '")');
          }, i * 500 );
          if ( i == 100 ) return false;
        });
      });
    }

    return {
        init: _init,
        currentlyPlaying: function() { return _currentlyPlaying },
        currentlyPlayingId: function() { return _currentlyPlayingId },
        initalTrackId: _initalTrackId,
        selectedTrackId: _selectedTrackId,
        trackListLength: _trackListLength,
        selectedClassName: _selectedClassName,
        nastyOldEvents: _nastyOldEvents,
        setFlicker : function(bool) { _flickr = bool; return "_flickr set to: " + bool; },
        toggleColor : function() {
            _theme = (_theme === "dark") ? _theme = "lite" : _theme = "dark";
            _toggleTheme();
        }
    };
})();

Player.init();