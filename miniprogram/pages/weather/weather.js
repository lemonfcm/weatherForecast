//weather.js
var app = getApp();//获取当前小程序实例，方便使用全局方法和属性
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var qqmapsdk;  //腾讯位置服务
Page({
  //1、页面数据部分，设置页面数据，后面空值将在页面显示时通过请求服务器获取
  data:{
        cur_id:app.curid,
        basic:"",
        now:"",
        time:"",
        suggestion:"",
        province: '',
        city: '',
        district:'',
        latitude: '',
        longitude: '',
        forecast:[]
        },
  //2、系统事件部分
  onLoad:function(){
    qqmapsdk = new QQMapWX({
      key: 'WMEBZ-LJT3G-A2MQV-I73UA-7OJIH-ONBUA' //自己的key秘钥
    });
  },
  onShow:function(){
    var vm = this;
    wx.showToast({ title: '加载中', icon: 'loading', duration: 10000 })
    if (app.useGeo){
      vm.getUserLocation();
    }else{
      wx.request({//请求服务器，类似ajax
        url: 'https://search.heweather.net/find',
        data: { location: app.curid , key: '01a7798b060b468abdad006ea3de4713' },//和风天气提供用户key，可自行注册获得
        header: { 'Content-Type': 'application/json' },
        success: function (res) {
          let cityName = res.data.HeWeather6[0].basic[0];
          console.log(cityName)
          vm.setData({
            province: cityName.admin_area,
            city: cityName.parent_city,
            latitude: cityName.lat,
            longitude: cityName.lon,
            district: (cityName.location == cityName.parent_city) ? "" : cityName.location
          })
          vm.getDetails();
        }
      })
    }
    
    },
  //3、自定义页面方法：获取当前天气API
  getnow:function(fn){
    wx.request({//请求服务器，类似ajax
      url: 'https://www.xiaoguge.cn/api/wxtest/now.php', 
      data: {city:app.curid,key:'01a7798b060b468abdad006ea3de4713'},//和风天气提供用户key，可自行注册获得
      header: {'Content-Type': 'application/json'},
      success: function(res) {
        //console.log(res);
        fn(res.data.HeWeather5[0]);
        }//成功后将数据传给回调函数执行
    })
  },
  //获取生活指数API
  getsuggestion:function(fn){
    wx.request({
      url: 'https://www.xiaoguge.cn/api/wxtest/suggestion.php', 
      data: {city:app.curid,key:'01a7798b060b468abdad006ea3de4713'},
      header: {'Content-Type': 'application/json'},
      success: function(res) {fn(res.data.HeWeather5[0]);}
    })
  },
  //获取未来7天的天气预报
  getforecast:function(fn){
    wx.request({
      url: 'https://free-api.heweather.net/s6/weather/forecast',
      data: { location: app.curid, key: 'b78d0218557e42b0a95e66488e684e4d' },
      header: { 'Content-Type': 'application/json' },
      success: function (res) {
        //console.log(res);
        fn(res.data.HeWeather6[0]);
       }
    })
  },
  //4、页面事件绑定部分
  bindViewTap:function(){
    wx.switchTab({url: '../city/city'})
  },//跳转菜单页面 

  //根据cur_id获取天气数据
  getDetails:function(){
    var vm = this;
    vm.getnow(function (d) {//获取到数据的回调函数
      wx.hideToast();
      d.now.cond.src = "../../images/cond-icon-heweather/" + d.now.cond.code + ".png";
      let timeArr = d.basic.update.loc.split(" ");
      let time = timeArr[0];
      vm.setData({
        basic: d.basic,
        now: d.now,
        time: time
      })//更新数据，视图将同步更新
    })
    vm.getsuggestion(function (d) {
      vm.setData({ suggestion: d.suggestion })//更新数据
    })
    vm.getforecast(function (d) {
      vm.setData({
        forecast: d.daily_forecast
      })
    })
  },
  //5、获取用户当前设置及二次授权
  getUserLocation: function () {
    let vm = this;
    wx.getSetting({
      success: (res) => {
        //console.log(JSON.stringify(res))
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      vm.getLocation();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          vm.getLocation();
        }
        else {
          //调用wx.getLocation的API
          vm.getLocation();
        }
      }
    })
  },
  // 微信获得经纬度
  getLocation: function () {
    let vm = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        //console.log(JSON.stringify(res))
        var latitude = res.latitude
        var longitude = res.longitude
        var speed = res.speed
        var accuracy = res.accuracy;
        vm.getLocal(latitude, longitude)
      },
      fail: function (res) {
        console.log('fail' + JSON.stringify(res))
      }
    })
  },
  // 获取当前地理位置并获取天气预报各个数据
  getLocal: function (latitude, longitude) {
    let vm = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        //console.log(JSON.stringify(res));
        let province = res.result.ad_info.province
        let city = res.result.ad_info.city
        let district = res.result.ad_info.district
        vm.setData({
          province: province,
          city: city,
          latitude: latitude,
          longitude: longitude,
          district: district
        })
        var citydata = longitude + ',' + latitude 
        wx.request({//请求服务器，类似ajax
          url: 'https://search.heweather.net/find',
          data: { location: citydata, key: '01a7798b060b468abdad006ea3de4713' },//和风天气提供用户key，可自行注册获得
          header: { 'Content-Type': 'application/json' },
          success: function (res) { 
            //console.log(res.data.HeWeather6[0].basic[0])
            app.curid = res.data.HeWeather6[0].basic[0].cid
            app.setlocal('curid', app.curid);
            vm.getDetails();
            }
        })
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        // console.log(res);
      }
    });
  }
})

