// pages/all/all.js
var app = getApp();
var request = require('../../../utils/request.js');
Page({
  data: {
    current_page: 1,
  },

  onShow: function () {
    //主要是判断是否从文章详情页返回的时候，浏览量加1
    if (app.globalData.dataKey) {
      this.data.list[app.globalData.dataKey].click++
      if (app.globalData.praise) {//如果在详情页点赞了，点赞量也加1
        this.data.list[app.globalData.dataKey].praise++
      }
      this.setData({
        list: this.data.list
      })
      app.globalData.dataKey = ''
      app.globalData.praise = ''
    }
  },

  //打开页面加载
  onLoad: function (options) {
    this.data.cateid = options.cateid;
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.request(1);
  },

  //发送请求,获得文章列表
  request: function (currentPage) {
    var that = this;
    var lng = app.globalData.lng;
    var lat = app.globalData.lat;
    var city = app.globalData.city;
    var data = { 'currentPage': currentPage, 'lng': lng, 'lat': lat };
    request.request({
      method: 'collectList', data: data, success(res) {
        wx.hideLoading()
        wx.stopPullDownRefresh()
        var list;
        if (that.data.list) {
          list = that.data.list.concat(res.data.articleList)
        } else {
          list = res.data.articleList
        }
        that.setData({
          list: list,
          host: app.globalData.serverHost,
          totalPage: res.data.totalPage,
        })
        if (!list[0]) {
          that.setData({
            empty: true
          })
        }else{
          that.setData({
            empty: false
          })
        }
      }
    });
  },

  //浏览图片
  clickImage: function (e) {
    var current = e.target.dataset.src;
    var imgs = e.target.dataset.imgs;
    for (var i in imgs) {
      imgs[i] = app.globalData.serverHost + imgs[i]
    }
    wx.previewImage({
      current: current,
      urls: imgs
    });
  },

  bindChange: function (e) {
    var that = this;
    that.setData({ currentTab: e.detail.current });
  },

  swichNav: function (e) {
    var that = this;
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab: e.target.dataset.current
      })
    }
  },

  toMap: function () {
    wx.navigateTo({
      url: '../map/map'
    })
  },

  //获得评论信息
  comment: function (e) {
    this.data.art_id = e.currentTarget.dataset.art_id;
    this.data.cateid = e.currentTarget.dataset.cateid;
    this.data.artk = e.currentTarget.dataset.k;
    this.setData({
      focus: true
    });
  },

  //评论
  formSubmit: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    var data = { 'formId': formId,'content': content.content, 'art_id': this.data.art_id, 'cateid': this.data.cateid };
    wx.showLoading({
      title: '提交中...',
    })
    request.request({
      method: 'articleCommentAdd', data: data, success(res) {
        if (res.data.code == 0) {
          wx.hideLoading()
          res.data.curComment[0].nickName = userInfo.nickName
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curComment)
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showToast({
            title: res.data.messges,
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
  },

  bindblur: function () {
    this.setData({
      focus: false,
      hint: false
    });

  },

  //获得评论的回复信息
  replyInfo: function (e) {
    this.data.art_id = e.currentTarget.dataset.art_id;
    this.data.to_mid = e.currentTarget.dataset.from_mid;
    this.data.to_name = e.currentTarget.dataset.from_name;
    this.data.artk = e.currentTarget.dataset.k;
    this.data.cateid = e.currentTarget.dataset.cateid;

    //禁止自己回复自己
    if (app.globalData.currentMid != this.data.to_mid) {
      this.setData({
        focus: true,
        hint: "回复" + this.data.to_name + '：'
      });
    } else {
      this.setData({
        focus: false,
      });
    }
  },

  //发送评论回复请求
  replyInfoRequest: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    wx.showLoading({
      title: '提交中...',
    })
    var data = { 'formId': formId, 'content': content.content, 'art_id': this.data.art_id, 'cateid': this.data.cateid, 'to_mid': this.data.to_mid, 'to_name': this.data.to_name };
    request.request({
      method: 'commentReplyAdd', data: data, success(res) {
        //console.log(res)
        if (res.data.code == 0) {
          wx.hideLoading()
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curReply)
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showToast({
            title: '回复失败了',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    })
  },

  //点赞
  praiseAdd: function (e) {
    var that = this
    var nickName = e.currentTarget.dataset.nickname;
    var art_id = e.currentTarget.dataset.art_id;
    var cateid = e.currentTarget.dataset.cateid;
    var k = e.currentTarget.dataset.k;
    var data = { 'art_id': art_id, 'cateid': cateid };
    request.request({
      method: 'goldRandGive', data: data, success(res) {
        if (res.data.code == 7) {
          wx.showToast({
            title: res.data.message,
            image: '/images/ha.png',
            icon: 'success',
            duration: 2000
          })
          return false;
        }
        if (res.data.code == 8) {
          wx.showToast({
            title: '谢谢您为' + nickName + ' 点出来' + res.data.message + '个金币',
            icon: 'success',
            image: '/images/money.png',
            duration: 2000
          })
        }
        if (res.data.code == 0) {
          wx.showToast({
            title: nickName + '：么么，谢谢您的赞',
            image: '/images/hua.png',
            icon: 'success',
            duration: 2000
          })
        }
        that.data.list[k].praise += 1;
        that.setData({
          list: that.data.list
        })
        console.log(that.data.list)
      }
    });
  },

  colorShow: function () {
    //获取当前的praise
    var praise = this.data.praise + 1;// 需要修改this.data.praise
    this.setData({
      isShow: true,
      praise: praise
    });
    wx.showToast({
      title: 'like',
      icon: 'success',
      duration: 2000
    })
  },

  //上拉刷新
  onPullDownRefresh: function () {
    this.data.list = '';
    this.data.current_page = 1
    //上拉刷新隐藏没有更多了
    this.setData({
      more: false
    })
    this.request(1);
  },

  //下拉加载
  onReachBottom: function () {
    this.data.current_page += 1;//当前页默认为1，每次请求前加1
    var totalPage = this.data.totalPage
    if (this.data.current_page <= totalPage) {
      this.request(this.data.current_page);
    } else {
      this.setData({
        more: true
      })
    }
  },

  //文章详情
  artDetail: function (e) {
    var art_id = e.currentTarget.dataset.art_id;
    var dataKey = e.currentTarget.dataset.k;//用来记录数组下标，返回的时候可以浏览量加1
    wx.navigateTo({
      url: '../../detail/detail?art_id=' + art_id + '&dataKey=' + dataKey
    })
  }
  ,

  //个人中心
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../../otherperson/otherperson?to_mid=' + to_mid
    })
  },

  //取消收藏
  delCollect: function (e) {
    var that = this
    wx.showModal({
      title: 'e圈提示',
      content: '确定要取消收藏此信息',
      success: function (res) {
        if (res.confirm) {
          var id = e.currentTarget.dataset.id;
          var k = e.currentTarget.dataset.k;
          var data = { 'colid': id };
          request.request({
            method: 'collectDel', data: data, success(res) {
              if (res.data.code == 0) {
                that.data.list.splice(k, 1)
                that.setData({
                  list: that.data.list
                })
              }
            }
          })
        } else if (res.cancel) {
          //console.log('用户点击取消')
        }
      }
    })
  }
})