<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Easy portal with golang</title>
    <!-- jquery 1.4 and jquery ui 1.8 -->
    <link rel="stylesheet" href="static/jquery-ui-portlet/lib/themes/1.10/start/jquery-ui-1.10.2.custom.min.css" />
    <link rel="stylesheet" href="static/jquery-ui-portlet/css/jquery.portlet.css?v=1.3.1" />
    <style type="text/css">
    body {font-size: 10px;}
    #menu li {font-size: 13px;}
    #LeftPane {
        overflow: auto;
    }
    #RightPane {
        padding: 2px;
        overflow: auto;
    }
    .ui-layout-resizer div {background-color: red;}
    .new {background-image: url(new.png) !important;background-repeat:no-repeat !important;background-position: right center !important;}
    .chat {background-image: url(duoshuo.png) !important;background-repeat:no-repeat !important;background-position: right center !important;}
    .api {background-image: url(api.png) !important;background-repeat:no-repeat !important;background-position: right center !important;}
    .source-github {background-image: url(github-small.png) !important;background-repeat:no-repeat !important;background-position: right center !important;}
    </style>
    <script src="static/jquery-ui-portlet/lib/jquery-1.8.3.min.js" type="text/javascript"></script>
    <script src="static/jquery-ui-portlet/lib/jquery-ui-1.10.2.custom.min.js" type="text/javascript"></script>
    <script src="static/jquery-ui-portlet/lib/jquery.layout-latest.min.js" type="text/javascript"></script>
    <script src="static/jquery-ui-portlet/script/jquery.portlet.pack.js?v=1.3.1"></script>
    <script>
        $(function() {
            $('body').layout({
                west: {
                    size: 160
                },
                onresize :  function() {
                  setTimeout(function() {
                    $('#mainFrame').width($('#RightPane').width() - 4);
                    $('#mainFrame').height($('#RightPane').height() - 4);
                  }, 500);
                }
            });
            $('#mainFrame').width($('#RightPane').width() - 4);
            $('#mainFrame').height($('#RightPane').height() - 4);
            $( "#menu" ).width($('#LeftPane').width() - 7).menu();
            $('#tabs').tabs();

            $('#menu a').click(function() {
                $('#menu .ui-state-active').removeClass('ui-state-active');
                $(this).parent().addClass('ui-state-active');
                $('#mainFrame').attr('src', $(this).attr('rel'));
            });
        });
    </script>
</head>
<body>
    <div id="TopPane" class="ui-layout-north ui-widget ui-widget-content ui-state-default" style="text-align:center">

        <h1 style='display:inline;margin-top:5em;'>Easy Portlet</h1>
        <h4 style='display:inline;margin-left: 1em;'></h4>

    </div>
    <div id="LeftPane" class="ui-layout-west ui-widget ui-widget-content">
        <ul id="menu">
            <li class='ui-state-default'><a href='#' rel="#">Jquery UI Portlet</a></li>
            <li><a href='#' class="api" rel="static/jquery-ui-portlet/api.html">插件API</a></li>
            <li><a href='#' class="source-github" rel="static/jquery-ui-portlet/demo/source-on-github.html">插件源码</a></li>
            <li><a href='#' rel="static/easy-portal/mix.html">综合演示</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/fixed-height.html">固定高度</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/disable-drag.html">禁止拖动</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/single-view.html">单视图模式</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/icon.html">标题栏图标</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/colspan.html">跨列模式</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/bootstrap.html">Bootstrap主题</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/getindexs.html">获取[行/列]</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/toggle.html">隐藏/显示切换</a></li>
            <li><a href='#' rel="static/jquery-ui-portlet/demo/drag-events.html">拖动事件</a></li>
            <li><a href='#' class="new" title="动态添加、删除portlet元素" rel="static/jquery-ui-portlet/demo/dynamic-add.html">动态增删（v1.3）</a></li>
            <li><a href='#' class="new" rel="static/jquery-ui-portlet/demo/v1.3-new-events.html">新事件(v1.3)</a></li>
            <li class='ui-state-highlight'><a href='#' rel="#">Angular Dashboard</a></li>
            <li><a href='#' rel="static/angular-dashboard-app/dist/index.html">Dashboard demo</a></li>
            <li><a href='#' rel="static/angular-d3-demo/index.html">D3 demo</a></li>

        </ul>
    </div>
    <div id="RightPane" class="ui-layout-center ui-helper-reset ui-widget-content">
        <iframe id="mainFrame" src="static/easy-portal/mix.html" frameborder="0"></iframe>
    </div>

</body>
</html>
