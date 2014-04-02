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

type Portlet struct {
        Id      int
        Pid     int
        Name    string
        X       int
        Y       int
        Url     string
        Type    string
        IsParent bool
        IsSelected bool
        UserPortlet []*UserPortlet  `orm:"reverse(many)"` // fk 的反向关系
}

type UserPortlet struct {
        Id      int
        X       int
        Y       int
        IsExpand bool
        IsDisplay bool
        Portlet *Portlet   `orm:"rel(fk)"` // RelForeignKey relation
}

type QuickMenu struct {
        Id int
        Userid string
        LinkName string
        LinkUrl string
        LinkImgUrl string
        Yn int
        ChannelId string
}


func init() {
        // 需要在init中注册定义的model
        orm.RegisterModel(new(User), new(Profile),new(Portlet),new(UserPortlet),new(QuickMenu) )
}