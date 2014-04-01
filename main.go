package main

import (
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
	_ "github.com/mattn/go-sqlite3"
	"go-easy-portal/models"
	_ "go-easy-portal/routers"
)

func init() {
	orm.RegisterDriver("mysql", orm.DR_Sqlite)

	orm.RegisterDataBase("default", "sqlite3", "data.db")
	// 数据库别名
	name := "default"

	// drop table 后再建表
	force := true

	// 打印执行过程
	verbose := true

	// 遇到错误立即返回
	err := orm.RunSyncdb(name, force, verbose)
	if err != nil {
		fmt.Println(err)
	}

}
func main() {

	o := orm.NewOrm()
	o.Using("default") // 默认使用 default，你可以指定为其他数据库

	profile := new(models.Profile)
	profile.Age = 30

	user := new(models.User)
	user.Profile = profile
	user.Name = "slene"

	fmt.Println(o.Insert(profile))
	fmt.Println(o.Insert(user))

	beego.Run()
}
