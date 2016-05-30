// error reporting/logging
function errorLog(err){
    alert(JSON.stringify(err));
}
// notify if device is not connected
function conn_success(device_connected){
    if(! device_connected){
        $('#music_files').children('div').remove();
        navigator.notification.beep(1);
        navigator.notification.alert('Please wait for device connection...', function(){
            return false;
        }, 'Device not connected!', 'Ok');
    }else{
        return true;
    }
}
/* listing the LocalFileStorage in order to select music files */
function localStorageSuccess(fileSystem) {
    $('#filesystem_navigation_list li').empty();
    //alert(JSON.stringify(fileSystem));
    currentDir = fileSystem;
    var rootReader = fileSystem.createReader();
    rootReader.readEntries(fillFileSystemNavList,errorLog);
}
// list folders and files of a directory
function listFoldersFiles(directory){
    currentDir = directory;
    if (currentDir.name == 'storage'){
        $('#browse_back_btn').prop('disabled','true');
    }else{
        $('#browse_back_btn').removeAttr('disabled');
    }
    $('#filesystem_navigation_list li').empty();
    var dirReader = directory.createReader();
    dirReader.readEntries(fillFileSystemNavList,errorLog);
}
// display folders and music files of a directory
function fillFileSystemNavList(entries){
    //check for mp3 regex
    var regex_mp3 = /^[^\.].*mp3$/i;
    //check for not stating with . regex
    var regex_dot = /^[^\.]/i;
    for(var i=0; i<entries.length; i++){
            if(entries[i].isFile && regex_mp3.test(entries[i].name)){
                /* its an .mp3 file */
                $('<li class="file"><img src="img/headphones.png"><h2>'+entries[i].name+'</h2></li>').appendTo('#filesystem_navigation_list');
            }
            if(entries[i].isDirectory && regex_dot.test(entries[i].name)){
                /* its a directory */
                $('<li class="directory"><img src="img/folder.png"><h2>'+entries[i].name+'</h2></li>').appendTo('#filesystem_navigation_list');
            }
        }
}
/* get disk usage data function and display it */
function getDiskUsage(){
    $.get(SERVER_ADDRESS+'/diskusage',function(data){
        var diskData = JSON.parse(data);
        $('#disk_usage .bar').css('width',diskData.availablePerc + '%');
        $('#disk_usage .bar').html(diskData.availableGB+' GB free');
        $('#disk_usage .bar').attr('aria-valuenow',diskData.availablePerc);
    });
};
/* get the songs on the server and display them */
function updateMusicFilesPreview(){
    $.get(SERVER_ADDRESS+'/showMusic',function(data){
        var fileArray = $.parseJSON(data);
        $('#music_files').children('div').remove();
        for (var i=0; i<fileArray.length; i++){
            $("<div style='clear:both; padding-top:10px;'><h3>"+fileArray[i]+"</h3><div class='play_img play_songlist'></div><div class='add_button'><a href='#popupPl' data-rel='popup' data-position-to='window' class='add_pl_button ui-btn ui-icon-plus ui-btn-icon-left ui-btn-b' data-transition='pop'>Add to Playlist</a></div><div class='delete_file'><button class='delete_button ui-btn ui-icon-delete ui-btn-icon-left ui-btn-b'>Delete</button></div></div>").appendTo('#music_files');
        }
    });
};
/* show all the playlists on the Playlist Page */
function fetchPlaylists(){
    $('#playlists').empty();
    /* listing the playlists */
    $.get(SERVER_ADDRESS+'/playlist',function(data){
        data = String(data);
        var playlists = data.split(",");
        if (playlists[0] != ''){
            for (var i=0; i<playlists.length; i++){
                $('#playlists').append("<div class='playlist_wrap'><div class='playlist_div'><div class='delete_pl'><button class='pl_delete_button ui-btn-icon-notext ui-btn ui-icon-delete ui-btn-icon-left ui-btn-b'></button></div><h3>"+ playlists[i] + "</h3></div></div>");
            }
        }
    });
}
/* get the settings saved to the database */
function getSettings(){
    $.get(SERVER_ADDRESS+'/settings',function(data){
        var settings = $.parseJSON(data);
        for (var i=0; i<settings.length;i++){
            $('#'+settings[i][0]).attr('value',settings[i][1]);
        }
    });
}
/* send the setting to the server */
function setSettings(){
    var frequency = $('#freq').val();
    $.ajax({
        url:SERVER_ADDRESS+'/settings',
        type:'POST',
        data: JSON.stringify({'freq': frequency}),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: true,
        success: function(msg){
          $('#saved-settings-success').fadeIn();
          $('#saved-settings-success').popup('open');
          $('#saved-settings-success').fadeOut(5000);
          setTimeout(function(){
              $('#saved-settings-success').popup('close');
          }, 4000);
        }
    });
}
/* function to call when app is paused/resumed */
function onPause(){
    $.get(SERVER_ADDRESS+'/freq_release',function(data){
    });
}
function onResume(){
    $.get(SERVER_ADDRESS+'/freq_release',function(data){
    });
}
