package routers

import (
        "go-easy-portal/controllers"
        "github.com/astaxie/beego"
)

func init() {
        beego.DirectoryIndex=true
	beego.Router("/", &controllers.MainController{})
}
