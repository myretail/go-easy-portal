'use strict';

angular.module('ui.dashboard', ['ui.bootstrap', 'ui.sortable']);

angular.module('ui.dashboard')
  .directive('dashboard', ['WidgetModel', 'WidgetDefCollection', '$modal', 'DashboardState', function (WidgetModel, WidgetDefCollection, $modal, DashboardState) {
    return {
      restrict: 'A',
      templateUrl: 'template/dashboard.html',
      scope: true,
      controller: function ($scope) {
        $scope.sortableOptions = {
          stop: function () {
            //TODO store active widgets in local storage on add/remove/reorder
            $scope.dashboardState.save($scope.widgets);
          },
          handle: '.widget-header'
        };
      },
      link: function (scope, element, attrs) {
        scope.options = scope.$eval(attrs.dashboard);
        scope.defaultWidgets = scope.options.defaultWidgets; // save widgets for reset
        //scope.widgetDefs = scope.options.widgetDefinitions;
        scope.widgetDefs = new WidgetDefCollection(scope.options.widgetDefinitions);
        console.log(scope.widgetDefs.getByName('Value'));

        var count = 1;
        var dashboardState = scope.dashboardState = new DashboardState(
          !!scope.options.useLocalStorage,
          scope.defaultWidgets
        );

        scope.addWidget = function (widgetDef) {
          var title = widgetDef.title ? widgetDef.title : ('Widget ' + count++);

          var wDef = scope.widgetDefs.getByName(widgetDef.name);
          if (!wDef) {
            throw 'Widget ' + widgetDef.name + ' is not found.';
          }

          var w = angular.copy(wDef);
          angular.extend(w, widgetDef); //TODO deep extend

          var widget = new WidgetModel(w, {
            title: title
          });

          scope.widgets.push(widget);
          scope.saveDashboard();
        };

        scope.removeWidget = function (widget) {
          scope.widgets.splice(_.indexOf(scope.widgets, widget), 1);
          scope.saveDashboard();
        };

        scope.openWidgetDialog = function (widget) {
          var options = widget.editModalOptions;

          // use default options when none are supplied by widget
          if (!options) {
            options = {
              templateUrl: 'template/widget-template.html',
              resolve: {
                widget: function () {
                  return widget;
                },
                optionsTemplateUrl: function () {
                  return scope.options.optionsTemplateUrl;
                }
              },
              controller: 'WidgetDialogCtrl'
            };
          }
          var modalInstance = $modal.open(options);

          // Set resolve and reject callbacks for the result promise
          modalInstance.result.then(
            function (result) {
              console.log('widget dialog closed');
              console.log('result: ', result);
              widget.title = result.title;
            },
            function (reason) {
              console.log('widget dialog dismissed: ', reason);

            }
          );

        };

        scope.clear = function () {
          scope.widgets = [];
        };

        scope.addWidgetInternal = function (event, widgetDef) {
          event.preventDefault();
          scope.addWidget(widgetDef);
        };

        scope.saveDashboard = function () {
          dashboardState.save(scope.widgets);
        };

        scope.loadWidgets = function (widgets) {
          scope.defaultWidgets = widgets; // save widgets for reset
          scope.clear();
          _.each(widgets, function (widgetDef) {
            scope.addWidget(widgetDef);
          });
        };

        scope.resetWidgetsToDefault = function () {
          scope.loadWidgets(scope.defaultWidgets);
        };

        // Set default widgets array
        var savedWidgets = dashboardState.load();

        if (savedWidgets) {
          scope.widgets = savedWidgets;
        } else if (scope.defaultWidgets) {
          scope.resetWidgetsToDefault();
        }

        // allow adding widgets externally
        scope.options.addWidget = scope.addWidget;
        scope.options.loadWidgets = scope.loadWidgets;

        // save state
        scope.$on('widgetChanged', function (event) {
          event.stopPropagation();
          scope.saveDashboard();
        });
      }
    };
  }]);
'use strict';

angular.module('ui.dashboard')
  .directive('widget', ['$compile', function ($compile) {
    function findWidgetPlaceholder(element) {
      // widget placeholder is the first (and only) child of .widget-content
      return angular.element(element.find('.widget-content').children()[0]);
    }

    return {

      link: function (scope, element) {
        // first child of .widget-content
        var elm = findWidgetPlaceholder(element);

        // the widget model/definition object
        var widget = scope.widget;

        // set up data source
        if (widget.dataModelType) {
          //var ds = widget.ds;
          var ds = new widget.dataModelType();
          widget.dataModel = ds;
          ds.setup(widget, scope);
          ds.init();
          scope.$on('$destroy', ds.destroy.bind(ds));
        }

        // .widget element (element is .widget-container)
        var widgetElm = element.find('.widget');

        // check for a template in widget def
        if (widget.templateUrl) {
          var includeTemplate = '<div ng-include="\'' + widget.templateUrl + '\'"></div>';
          var templateElm = angular.element(includeTemplate);
          elm.replaceWith(templateElm);
          elm = templateElm;
        } else if (widget.template) {
          elm.replaceWith(widget.template);
          elm = findWidgetPlaceholder(element);
        } else {
          elm.attr(widget.directive, '');

          if (widget.attrs) {
            _.each(widget.attrs, function (value, attr) {
              elm.attr(attr, value);
            });
          }

          if (widget.dataAttrName) {
            elm.attr(widget.dataAttrName, 'widgetData');
          }
        }

        scope.grabResizer = function (e) {

          // ignore middle- and right-click
          if (e.which !== 1) {
            return;
          }

          e.stopPropagation();
          e.originalEvent.preventDefault();

          // get the starting horizontal position
          var initX = e.clientX;
          // console.log('initX', initX);

          // Get the current width of the widget and dashboard
          var pixelWidth = widgetElm.width();
          var pixelHeight = widgetElm.height();
          var widgetStyleWidth = widget.style.width;
          var widthUnits = widget.widthUnits;
          var unitWidth = parseFloat(widgetStyleWidth);

          // create marquee element for resize action
          var $marquee = angular.element('<div class="widget-resizer-marquee" style="height: ' + pixelHeight + 'px; width: ' + pixelWidth + 'px;"></div>');
          widgetElm.append($marquee);

          // determine the unit/pixel ratio
          var transformMultiplier = unitWidth / pixelWidth;

          // updates marquee with preview of new width
          var mousemove = function (e) {
            var curX = e.clientX;
            var pixelChange = curX - initX;
            var newWidth = pixelWidth + pixelChange;
            $marquee.css('width', newWidth + 'px');
          };

          // sets new widget width on mouseup
          var mouseup = function (e) {
            // remove listener and marquee
            jQuery(window).off('mousemove', mousemove);
            $marquee.remove();

            // calculate change in units
            var curX = e.clientX;
            var pixelChange = curX - initX;
            var unitChange = Math.round(pixelChange * transformMultiplier * 100) / 100;

            // add to initial unit width
            var newWidth = unitWidth * 1 + unitChange;
            widget.setWidth(newWidth + widthUnits);
            scope.$emit('widgetChanged', widget);
            scope.$apply();
          };

          jQuery(window).on('mousemove', mousemove).one('mouseup', mouseup);

        };

        // replaces widget title with input
        scope.editTitle = function (widget) {
          widget.editingTitle = true;
          // HACK: get the input to focus after being displayed.
          setTimeout(function () {
            widgetElm.find('form.widget-title input:eq(0)').focus()[0].setSelectionRange(0, 9999);
          }, 0);
        };

        // saves whatever is in the title input as the new title
        scope.saveTitleEdit = function (widget) {

          widget.editingTitle = false;
        };

        $compile(elm)(scope);

        scope.$emit('widgetAdded', widget);
      }
    };
  }]);
'use strict';

angular.module('ui.dashboard')
  .factory('DashboardState', ['WidgetModel', function (WidgetModel) {
    function DashboardState(useLocalStorage, widgetDefinitions) {
      this.useLocalStorage = !!useLocalStorage;
      this.widgetDefinitions = widgetDefinitions;
    }

    DashboardState.prototype = {
      // Takes array of widgets, serializes, and saves state.
      // (currently stored in localStorage)
      save: function (lsKey, widgets) {
        console.log('saving dash state');
        if (!this.useLocalStorage) {
          return true;
        }
        if (arguments.length === 1) {
          widgets = lsKey;
          lsKey = 'default';
        }
        var serialized = _.map(widgets, function (widget) {
          var widgetObject = {
            title: widget.title,
            name: widget.name,
            style: widget.style,
            dataModelOptions: widget.dataModelOptions
          };

          return widgetObject;
        });

        serialized = JSON.stringify(serialized);
        localStorage.setItem('widgets.' + lsKey, serialized);
        return true;
      },

      // Returns array of instantiated widget objects
      load: function (key) {
        if (!this.useLocalStorage) {
          return null;
        }

        var serialized, deserialized, result = [];
        key = key || 'default';

        // try loading localStorage item
        if (!(serialized = localStorage.getItem('widgets.' + key))) {
          return null;
        }

        try { // to deserialize the string
          deserialized = JSON.parse(serialized);
        } catch (e) {
          // bad JSON, clear localStorage
          localStorage.removeItem('widgets.' + key);
          return null;
        }

        // instantiate widgets from stored data
        for (var i = 0; i < deserialized.length; i++) {

          // deserialized object
          var widgetObject = deserialized[i];
          // widget definition to use
          var widgetDefinition = false;

          // find definition with same name
          for (var k = this.widgetDefinitions.length - 1; k >= 0; k--) {
            var def = this.widgetDefinitions[k];
            if (def.name === widgetObject.name) {
              widgetDefinition = def;
              break;
            }
          }

          // check for no widget
          if (!widgetDefinition) {
            // no widget definition found, remove and return false
            localStorage.removeItem('widgets.' + key);
            return null;
          }

          // push instantiated widget to result array
          result.push(new WidgetModel(widgetDefinition, widgetObject));
        }

        return result;
      }
    };
    return DashboardState;
  }]);
'use strict';

angular.module('ui.dashboard')
  .factory('WidgetDataModel', function () {
    function WidgetDataModel() {
    }

    WidgetDataModel.prototype = {
      setup: function (widget, scope) {
        this.dataAttrName = widget.dataAttrName;
        this.dataModelOptions = widget.dataModelOptions;
        this.widgetScope = scope;
      },

      updateScope: function (data) {
        this.widgetScope.widgetData = data;
      },

      init: function () {
        // to be overridden by subclasses
      },

      destroy: function () {
        // to be overridden by subclasses
      }
    };

    return WidgetDataModel;
  });
'use strict';

angular.module('ui.dashboard')
  .factory('WidgetDefCollection', function () {
    function WidgetDefCollection(widgetDefs) {
      this.push.apply(this, widgetDefs);

      // build (name -> widget definition) map for widget lookup by name
      var map = {};
      _.each(widgetDefs, function (widgetDef) {
        map[widgetDef.name] = widgetDef;
      });
      this.map = map;
    }

    WidgetDefCollection.prototype = Object.create(Array.prototype);

    WidgetDefCollection.prototype.getByName = function (name) {
      return this.map[name];
    };

    return WidgetDefCollection;
  });
'use strict';

angular.module('ui.dashboard')
  .factory('WidgetModel', function () {
    // constructor for widget model instances
    function WidgetModel(Class, overrides) {
      overrides = overrides || {};
      angular.extend(this, {
        title: 'Widget',
        name: Class.name,
        attrs: Class.attrs,
        dataAttrName: Class.dataAttrName,
        dataTypes: Class.dataTypes,
        dataModelType: Class.dataModelType,
        dataModelOptions: Class.dataModelOptions,
        style: Class.style
      }, overrides);
      this.style = this.style || { width: '33%' };
      this.setWidth(this.style.width);

      if (Class.templateUrl) {
        this.templateUrl = Class.templateUrl;
      } else if (Class.template) {
        this.template = Class.template;
      } else {
        var directive = Class.directive || Class.name;
        this.directive = directive;
      }
    }

    WidgetModel.prototype = {

      // sets the width (and widthUnits)
      setWidth: function (width, units) {
        width = width.toString();
        units = units || width.replace(/^[-\.\d]+/, '') || '%';
        this.widthUnits = units;
        width = parseFloat(width);

        if (width < 0) {
          return false;
        }

        if (units === '%') {
          width = Math.min(100, width);
          width = Math.max(0, width);
        }
        this.style.width = width + '' + units;
        return true;
      }

    };

    return WidgetModel;
  });
'use strict';

angular.module('ui.dashboard')
  .controller('WidgetDialogCtrl', function ($scope, $modalInstance, widget, optionsTemplateUrl) {
    // add widget to scope
    $scope.widget = widget;

    // set up result object
    $scope.result = {
      title: widget.title
    };

    // look for optionsTemplateUrl on widget
    $scope.optionsTemplateUrl = optionsTemplateUrl || 'template/widget-default-content.html';

    $scope.ok = function () {
      $modalInstance.close($scope.result);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
angular.module("ui.dashboard").run(["$templateCache", function($templateCache) {

  $templateCache.put("template/dashboard.html",
    "<div>\n" +
    "    <div class=\"btn-toolbar\">\n" +
    "        <div class=\"btn-group\" ng-if=\"!options.widgetButtons\">\n" +
    "            <button type=\"button\" class=\"dropdown-toggle btn btn-primary\" data-toggle=\"dropdown\">Add Widget <span\n" +
    "                    class=\"caret\"></span></button>\n" +
    "            <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "                <li ng-repeat=\"widget in widgetDefs\">\n" +
    "                    <a href=\"#\" ng-click=\"addWidgetInternal($event, widget);\"><span class=\"label label-primary\">{{widget.name}}</span></a>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"btn-group\" ng-if=\"options.widgetButtons\">\n" +
    "            <button ng-repeat=\"widget in widgetDefs\"\n" +
    "                    ng-click=\"addWidgetInternal($event, widget);\" type=\"button\" class=\"btn btn-primary\">\n" +
    "                {{widget.name}}\n" +
    "            </button>\n" +
    "        </div>\n" +
    "\n" +
    "        <button class=\"btn btn-warning\" ng-click=\"resetWidgetsToDefault()\">Default Widgets</button>\n" +
    "\n" +
    "        <button ng-click=\"clear();\" type=\"button\" class=\"btn btn-info\">Clear</button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ui-sortable=\"sortableOptions\" ng-model=\"widgets\" class=\"dashboard-widget-area\">\n" +
    "        <div ng-repeat=\"widget in widgets\" ng-style=\"widget.style\" class=\"widget-container\" widget>\n" +
    "            <div class=\"widget panel panel-default\">\n" +
    "                <div class=\"widget-header panel-heading\">\n" +
    "                    <h3 class=\"panel-title\">\n" +
    "                        <span class=\"widget-title\" ng-dblclick=\"editTitle(widget)\" ng-hide=\"widget.editingTitle\">{{widget.title}}</span>\n" +
    "                        <form action=\"\" class=\"widget-title\" ng-show=\"widget.editingTitle\" ng-submit=\"saveTitleEdit(widget)\">\n" +
    "                            <input type=\"text\" ng-model=\"widget.title\" class=\"form-control\">\n" +
    "                        </form>\n" +
    "                        <span class=\"label label-primary\">{{widget.name}}</span>\n" +
    "                        <span ng-click=\"removeWidget(widget);\" class=\"glyphicon glyphicon-remove\"></span>\n" +
    "                        <span ng-click=\"openWidgetDialog(widget);\" class=\"glyphicon glyphicon-cog\"></span>\n" +
    "                    </h3>\n" +
    "                </div>\n" +
    "                <div class=\"widget-content panel-body\">\n" +
    "                    <div></div>\n" +
    "                </div>\n" +
    "                <div class=\"widget-ew-resizer\" ng-mousedown=\"grabResizer($event)\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>"
  );

  $templateCache.put("template/widget-default-content.html",
    "No edit template specified for this widget ({{widget.name}})."
  );

  $templateCache.put("template/widget-template.html",
    "<div class=\"modal-header\">\n" +
    "    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "  <h3>Widget Options <small>{{widget.title}}</small></h3>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "    <form name=\"form\" novalidate class=\"form-horizontal\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <label for=\"widgetTitle\" class=\"col-sm-2 control-label\">Title</label>\n" +
    "            <div class=\"col-sm-10\">\n" +
    "                <input type=\"text\" class=\"form-control\" name=\"widgetTitle\" ng-model=\"result.title\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-include=\"optionsTemplateUrl\"></div>\n" +
    "    </form>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button type=\"button\" class=\"btn btn-default\" ng-click=\"cancel()\">Cancel</button>\n" +
    "    <button type=\"button\" class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n" +
    "</div>"
  );

}]);
