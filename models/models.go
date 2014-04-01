package models

import (
    "github.com/astaxie/beego/orm"
)

type User struct {
    Id          int
    Name        string
    Profile     *Profile   `orm:"rel(one)"` // OneToOne relation
}

type Profile struct {
    Id          int
    Age         int16
    User        *User   `orm:"reverse(one)"` // 设置反向关系(可选)
}

func init() {
    // 需要在init中注册定义的model
    orm.RegisterModel(new(User), new(Profile))
}