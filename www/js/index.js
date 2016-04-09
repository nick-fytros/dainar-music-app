/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */ https://github.com/nick-fytros/Dainar_Music.git
 /* holds the current directory */
var SERVER_ADDRESS = 'http://192.168.2.1:3000'
var currentDir;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /* ALL THE FUNCTIONS ARE IN THE my_functions.js FILE */
        // device type
        var deviceType = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
        var device_connected = false;
        /* song to be put on playlist */
        var playlist_song;
        $('#browse_back_btn').prop('disabled','true');
        $('#upload_btn').prop('disabled','true');
        $('#progress').addClass('hidden');
        // show disk usage
        getDiskUsage();
        // sync settings with app
        getSettings();
        // blinking status dot
        $('.dot').fadeOut(500).fadeIn(500);
        var conn_blink = setInterval(function(){
            $('.dot').fadeOut(500).fadeIn(500);
        }, 1000);
        // checking for device connectivity after 2 seconds and then every 5 seconds
        function check_connectivity(){
            $.get(SERVER_ADDRESS+'/status',function(data){
                if (data.status == 'ok'){
                    clearInterval(conn_blink);
                    device_connected = true;
                    $('.dot').addClass('device_connected');
                    $('.connection_status').children('h4').html('Connected');
                    getDiskUsage();
                }
            }).fail(function() {
                if (device_connected){
                    device_connected = false;
                    $('.dot').removeClass('device_connected');
                    $('.connection_status').children('h4').html('Connecting');
                    clearInterval(conn_blink);
                    conn_blink = setInterval(function(){
                        $('.dot').fadeOut(500).fadeIn(500);
                    }, 1000);
                }
            });
            check_conn = setTimeout(check_connectivity, 5000);
        }
        var check_conn = setTimeout(check_connectivity, 1000);
        //pause and resume the app
        document.addEventListener('pause', onPause, false);
        document.addEventListener('resume', onResume, false);
        // request the file system when the button is clicked
        $(document).on('tap','#browse_music_btn',function(){
            if (deviceType == 'iPhone' || deviceType == 'iPad'){
                //alert('Γαμημένα iPhone');
                /*window.plugins.iOSAudioPicker.getAudio(function(data){
                    alert(JSON.stringify(data));
                },errorLog,true,true);*/
                window.resolveLocalFileSystemURL('file:///storage',localStorageSuccess,errorLog);
            }else if(deviceType == 'Android'){
                window.resolveLocalFileSystemURL('file:///storage',localStorageSuccess,errorLog);
            }else{
                alert('Not supported device');
            }
        });
        // when a dir is clicked
        $(document).on('tap','#filesystem_navigation_list li',function(){
            $('#upload_btn').prop('disabled','true');
            if ($(this).hasClass('directory')){
                currentDir.getDirectory($(this).find('h2').text(), {
                    create : false,
                    exclusive : false
                }, listFoldersFiles, errorLog);
            }
        });
        // when back button is clicked
        $(document).on('tap','#browse_back_btn',function(){
            currentDir.getParent(listFoldersFiles,errorLog);
        });
        // when a music file is clicked
        $(document).on('tap','li.file',function(){
            $(this).toggleClass('picked_for_upload');
            if ($('#filesystem_navigation_list').find('.picked_for_upload').length > 0 ){
                $('#upload_btn').removeAttr('disabled');
            }else{
                $('#upload_btn').prop('disabled','true');
            }
        });
        // upload event button
        $(document).on('tap','#upload_btn',function(){
            // dont allow if device is not connected to the server
            if (! conn_success(device_connected)){
                return;
            }
            $('#progress').removeClass('hidden');
            var files_to_upload = 0;
            var files_uploaded = 0;
            $('#filesystem_navigation_list').find('.picked_for_upload').each(function(){
                files_to_upload++;
            });
            $('#files_uploaded').html('Files uploaded: '+files_uploaded+'/'+files_to_upload);
            $('#filesystem_navigation_list').find('.picked_for_upload').each(function(){
                currentDir.getFile($(this).find('h2').text(), {create: false, exclusive: false}, function(file){
                    function upload_complete(r) {
                        //alert("Code = " + r.responseCode);
                        //alert("Response = " + r.response);
                        //alert("Sent = " + r.bytesSent);
                        /* set to 100% at end of upload and notify*/
                        files_uploaded++
                        $('#progress .bar').css('width',100 + '%');
                        $('#progress .bar').html(100+'%');
                        $('#progress .bar').attr('aria-valuenow',100);
                        $('#progress .bar').removeClass('active');
                        $('#files_uploaded').html('Files uploaded: '+files_uploaded+'/'+files_to_upload);
                        if (files_uploaded == files_to_upload){
                            $('li.file').removeClass('picked_for_upload');
                            $('#upload_btn').prop('disabled','true');
                            //navigator.vibrate(1000);
                            navigator.notification.beep(1);
                            $('#upload_success_popup').popup('open');
                            $('#files_uploaded').html('Files uploaded: '+0+'/'+0);
                            $('#progress .bar').css('width',0 + '%');
                            $('#progress .bar').html(0+'%');
                            $('#progress .bar').attr('aria-valuenow',0);
                            $('#upload_success_popup').fadeOut(6000);
                            var popupclose = setTimeout(function(){
                                $('#upload_success_popup').popup('close');
                            }, 4000);
                            $('#files_uploaded').html('');
                            $('#progress').addClass('hidden');
                        }
                    }
                    var uri = encodeURI(SERVER_ADDRESS);
                    var options = new FileUploadOptions();
                    options.fileKey="upl";
                    options.fileName=file.name;/*fileURL.substr(fileURL.lastIndexOf('/')+1); nativeURL,fullPath*/
                    options.mimeType="audio/mp3";

                    var headers={'dataType':'json'};

                    options.headers = headers;

                    var ft = new FileTransfer();
                    ft.onprogress = function(progressEvent) {
                        if (progressEvent.lengthComputable) {
                            //loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
                            var progress = parseInt(progressEvent.loaded / progressEvent.total * 100, 10);
                            $('#progress .bar').css('width',progress + '%');
                            $('#progress .bar').html(progress+'%');
                            $('#progress .bar').addClass('active');
                            $('#progress .bar').attr('aria-valuenow',progress);
                        } else {
                            //loadingStatus.increment();
                            alert(JSON.stringify(loadingStatus.increment()));
                        }
                    };
                    ft.upload('file://'+file.fullPath, uri, upload_complete, errorLog, options);
                }, errorLog);
            });
        });
        // get music files
        $(document).on('tap','a.get_music_files',function(){
            // dont allow if device is not connected to the server
            if (! conn_success(device_connected)){
                return;
            }
            updateMusicFilesPreview();
        });
        /* play button click */
        $(document).on('tap','div.play_img',function(){
            var song_name = $(this).siblings('h3').text();
            var play_type;
            if ($(this).hasClass('play_songlist')){
                play_type = 'play_songlist';
            }else if($(this).hasClass('play_playlist')){
                play_type = 'play_playlist';
            }
            $('div.pause_img').addClass('play_img');
            $('div.play_img').removeClass('pause_img');
            $(this).toggleClass('play_img');
            $(this).toggleClass('pause_img');
            $.get(SERVER_ADDRESS+'/play/'+song_name+'/'+play_type,function(data){
                
            });
        });
        /* stop button click */
        $(document).on('tap','div.stop_img',function(){
            $('div.pause_img').addClass('play_img');
            $('div.play_img').removeClass('pause_img');
            $.get(SERVER_ADDRESS+'/stop',function(data){
                
            });
        });
        /* play next song */
        $(document).on('tap','div.next_img', function(){
            $.get(SERVER_ADDRESS+'/play/next',function(data){
                
            });
        });
        /* play previous song */
        $(document).on('tap','div.prev_img', function(){
            $.get(SERVER_ADDRESS+'/play/previous',function(data){
                
            });
        });
        /* delete button click*/
        $(document).on('tap','button.delete_button',function(){
            var json_file_name = $(this).parent('.delete_file').siblings('h3').text();
            var clicked_element = $(this).parent('.delete_file').parent('div');
            $.ajax({
                url:SERVER_ADDRESS+'/delete',
                type:'POST',
                data: JSON.stringify({song_name: json_file_name}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: true,
                success: function(msg){
                    //alert(msg);
                    /* update disk usage progress bar */
                    getDiskUsage();
                    clicked_element.remove();
                }
            });
        });
        // swipe events on pages
        $(document).on('swipeleft','div#upload_page',function(){
            // dont allow if device is not connected to the server
            if (! conn_success(device_connected)){
                return;
            }
            updateMusicFilesPreview();
            $(':mobile-pagecontainer').pagecontainer('change', '#start_page',{ transition:'slide'});
        });
        $(document).on('swipeleft','div#start_page',function(){
            $(':mobile-pagecontainer').pagecontainer('change', '#playlist_page',{ transition:'slide'});
        });
        $(document).on('swiperight','div#start_page',function(){
            $(':mobile-pagecontainer').pagecontainer('change', '#upload_page',{ transition:'slide',reverse:true});
        });
        $(document).on('swiperight','div#playlist_page',function(){
            // dont allow if device is not connected to the server
            if (! conn_success(device_connected)){
                return;
            }
            updateMusicFilesPreview();
            $(':mobile-pagecontainer').pagecontainer('change', '#start_page',{ transition:'slide',reverse:true});
        });
        /* add to playlist button */
        $(document).on('tap','a.add_pl_button',function(){
            playlist_song = $(this).parent('.add_button').siblings('h3').text();
            $('#pl').val('');
            $('#pl_message').removeClass();
            $('#pl_message').text('');
            $('div.playlist_listing').empty();
            $.get(SERVER_ADDRESS+'/playlist',function(data){
                data = String(data);
                var playlists = data.split(",");
                for (var i=0; i<playlists.length; i++){
                    $('div.playlist_listing').append('<p>'+ playlists[i] + '</p>');
                }
            });
        });
        /* clicking on an existing playlist to add the song */
        $(document).on('tap','div.playlist_listing p',function(){
            $('#pl').val($(this).text());
            $('button.submit_playlist').trigger('tap');
        });
        /* adding new playlist */
        $(document).on('tap','button.submit_playlist',function(e){
            e.preventDefault();
            var playlist_name = $('#pl').val();
            var data_obj;
            $.ajax({
                url:SERVER_ADDRESS+'/playlist',
                type:'POST',
                data: JSON.stringify({song: playlist_song, playlist:playlist_name}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: true,
                success: function(msg){
                }
            }).done(function(data){
                data_obj = JSON.parse(data);
                $('#pl_message').removeClass();
                $('#pl').val('');
                $('#pl_message').addClass(data_obj['result']);
                $('#pl_message').text(data_obj['message']);
            });
        });
        /* visiting playlist page event */
        $(':mobile-pagecontainer').on('pagecontainerchange', function(event, ui){
            /* if the page is #playlist_page */
            if ($(':mobile-pagecontainer').pagecontainer('getActivePage')[0].id == 'playlist_page'){
                fetchPlaylists();
            }
            if ($(':mobile-pagecontainer').pagecontainer('getActivePage')[0].id == 'start_page'){
                updateMusicFilesPreview();
            }
            if ($(':mobile-pagecontainer').pagecontainer('getActivePage')[0].id == 'settings_page'){
                getSettings();
            }
        });
        /* tapping on a playlist on playlist page */
        $(document).on('tap','div.playlist_div',function(){
            if ($('div.playlist_div').hasClass('playlist_tapped')){
                $('div.playlist_div').removeClass('playlist_tapped');
                $('div.playlist_wrap').children('div.playlist_song_div').remove();
            }else{
                $('div.playlist_div').removeClass('playlist_tapped');
                $(this).addClass('playlist_tapped');
                /* and list the playlist's songs */
                var playlist = $(this).children('h3').text();
                var pl_wrap = $(this).parent('.playlist_wrap');
                $.get(SERVER_ADDRESS+'/playlist/'+playlist,function(data){
                    data = String(data);
                    var playlist_songs = data.split(",");
                    $('div.playlist_wrap').children('div.playlist_song_div').remove();
                    for (var i=0; i<playlist_songs.length; i++){
                        $("<div class='playlist_song_div'><h3>"+playlist_songs[i]+"</h3><div class='play_img play_playlist'></div></div>").appendTo(pl_wrap);
                    }
                });
            }
        });
        /* on input send settings */
        $(document).on('tap','#save-settings',function(){
            setSettings();
        });
        /* delete playlist button */
        $(document).on('tap','button.pl_delete_button',function(){
            var playlist = $(this).parent('.delete_pl').siblings('h3').text();
            $.ajax({
                url:SERVER_ADDRESS+'/playlist/delete',
                type:'POST',
                data: JSON.stringify({playlist: playlist}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: true,
                success: function(msg){
                    fetchPlaylists();
                }
            });
        });
        /* music file upload */
        $('#file_upload').fileupload({
            dataType: 'json',
            done: function(e, data){
                var fileArray = $.parseJSON(data.result);
                for (var i=0; i<fileArray.length; i++){
                    /* append upload results to list */
                }
                $('#progress .bar').removeClass('active');
                getDiskUsage();
                updateMusicFilesPreview();
            },
            progressall: function(e,data){
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .bar').css('width',progress + '%');
                $('#progress .bar').html(progress+'%');
                $('#progress .bar').addClass('active');
                $('#progress .bar').attr('aria-valuenow',progress);
            }
        });
        
    }
};