// 请将 AppId 改为你自己的 AppId，否则无法本地测试
var appId = 'JVcHWdgny33gWo3kEOvcUgOW-gzGzoHsz';
var appKey = '4lTe5hwnx58HYPrFXyAea6QV';
var server = 'https://jvchwdgn.lc-cn-n1-shared.com';
 //server = 'http://192.168.1.2:5000';

 server = 'http://211.140.167.4:5000';
// sanya
// server= 'http://192.168.8.47:5000'

AV.init({
  appId: appId,
  appKey: appKey,
  serverURL: server,
});
localStorage.setItem('debug', 'LC*');
// 请换成你自己的一个房间的 conversation id（这是服务器端生成的）
var roomId = '60421d6912e38b5bf6e67f41';
//roomId = '5989569dda2f6000616cfb671';


// 每个客户端自定义的 id
var clientId = 'LeanCloud';

// 创建实时通信实例
var realtime = new AV.Realtime({
  appId: appId,
  appKey: appKey,
  server: server,
  plugins: AV.TypedMessagesPlugin,
});
var client;
var messageIterator;

// 用来存储创建好的 roomObject
var room;

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

var loginBtn = document.getElementById('login-btn');
var signUpBtn = document.getElementById('signup-btn');
var sendBtnAsFile = document.getElementById('send-btn-as-file');
var sendBtn = document.getElementById('send-btn');
var inputName = document.getElementById('input-name');
var inputPassword = document.getElementById('input-password');
var inputSend = document.getElementById('input-send');
var printWall = document.getElementById('print-wall');

var jroomid = document.getElementById('roomid');

var joinBtn = document.getElementById('join-btn');
// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;
var myclient;
bindEvent(loginBtn, 'click', login);
bindEvent(signUpBtn, 'click', signUp);
bindEvent(sendBtn, 'click', sendMsg);
bindEvent(sendBtnAsFile, 'click', sendMsgAsFile);


bindEvent(joinBtn, 'click', join);

bindEvent(document.body, 'keydown', function(e) {
  if (e.keyCode === 13) {
    if (firstFlag) {
      login();
    } else {
      sendMsg();
    }
  }
});

function signUp() {
  AV.User.signUp(inputName.value, inputPassword.value)
    .then(function(user) {
      showLog('注册成功');
      login();
    })
    .catch(function(error) {
      showLog('注册失败：' + error.message);
    });
}

function login() {
  showLog('正在登录');
  var val = inputName.value;
  if (val) {
    clientId = val;
  }
  if (!firstFlag) {
    client.close();
  }

  // 创建聊天客户端
  /*
  return AV.User.logIn(clientId, inputPassword.value)
    .then(function(user) {
      return realtime.createIMClient(user);
    })
*/
   realtime.createIMClient(clientId)
    .then(function(c) {
      showLog('连接成功');
      firstFlag = false;
      client = c;
      myclient = c;
      client.on('disconnect', function() {
        showLog('[disconnect] 服务器连接已断开');
      });
      client.on('offline', function() {
        showLog('[offline] 离线（网络连接已断开）');
      });
      client.on('online', function() {
        showLog('[online] 已恢复在线');
      });
      client.on('schedule', function(attempt, time) {
        showLog(
          '[schedule] ' +
            time / 1000 +
            's 后进行第 ' +
            (attempt + 1) +
            ' 次重连'
        );
      });
      client.on('retry', function(attempt) {
        showLog('[retry] 正在进行第 ' + (attempt + 1) + ' 次重连');
      });
      client.on('reconnect', function() {
        showLog('[reconnect] 重连成功');
      });
      client.on('reconnecterror', function() {
        showLog('[reconnecterror] 重连失败');
      });
      client.on("invited", function invitedEventHandler(payload, conversation) {
        showLog("invited")
        showLog("roomid",conversation.id)
        jroomid.value=conversation.id
        console.log(payload.invitedBy, conversation.id);
    });
    client.on('message', function(message, conversation) {
      console.log('收到新消息：' + message.text);
      showLog('收到新消息：' + message.text);
  });
      // 获取对话
      //return c.getConversation(roomId);
    })
    .catch(function(err) {
      console.error(err);
      showLog('错误：' + err.message);
    });
}

function sendMsg() {
  var val = inputSend.value;

  // 不让发送空字符
  if (
    !String(val)
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
  ) {
    alert('请输入点文字！');
  }

  // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
  room.send(new AV.TextMessage(val)).then(function(message) {
    // 发送成功之后的回调
    inputSend.value = '';
    showLog(
      '（' + formatTime(message.timestamp) + '）  自己： ',
      encodeHTML(message.text)
    );
    printWall.scrollTop = printWall.scrollHeight;
  });
}

// 发送多媒体消息示例
function sendMsgAsFile() {
  var val = inputSend.value;

  // 不让发送空字符
  if (
    !String(val)
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
  ) {
    alert('请输入点文字！');
  }
  new AV.File('message.txt', {
    base64: b64EncodeUnicode(val),
  })
    .save()
    .then(function(file) {
      return room.send(new AV.FileMessage(file));
    })
    .then(function(message) {
      // 发送成功之后的回调
      inputSend.value = '';
      showLog(
        '（' + formatTime(message.timestamp) + '）  自己： ',
        createLink(message.getFile().url())
      );
      printWall.scrollTop = printWall.scrollHeight;
    })
    .catch(console.warn);
}

function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    })
  );
}

Usernames = {
  _cache: {},
  get: function(id) {
    if (!this._cache[id]) {
      this._cache[id] = new AV.Query(AV.User)
        .get(id)
        .then(
          function(user) {
            var username = user.getUsername();
            this._cache[id] = username;
            return username;
          }.bind(this)
        )
        .catch(
          function() {
            this._cache[id] = id;
            return id;
          }.bind(this)
        );
    }
    return this._cache[id];
  },
};

// 显示接收到的信息
function showMsg(message, isBefore) {
  var text = message.text;
  AV.Promise.resolve()
    .then(function() {
      if (message.from === clientId) {
        return '自己';
      } else {
        return Usernames.get(message.from);
      }
    })
    .then(function(from) {
      if (message instanceof AV.TextMessage) {
        if (
          String(text)
            .replace(/^\s+/, '')
            .replace(/\s+$/, '')
        ) {
          showLog(
            '（' +
              formatTime(message.timestamp) +
              '）  ' +
              encodeHTML(from) +
              '： ',
            encodeHTML(message.text),
            isBefore
          );
        }
      } else if (message instanceof AV.FileMessage) {
        showLog(
          '（' +
            formatTime(message.timestamp) +
            '）  ' +
            encodeHTML(from) +
            '： ',
          createLink(message.getFile().url()),
          isBefore
        );
      }
    });
}

// 拉取历史
bindEvent(printWall, 'scroll', function(e) {
  if (printWall.scrollTop < 20) {
    getLog();
  }
});

// 获取消息历史
function getLog(callback) {
  var height = printWall.scrollHeight;
  if (logFlag) {
    return;
  } else {
    // 标记正在拉取
    logFlag = true;
  }
  messageIterator
    .next()
    .then(function(result) {
      var data = result.value;
      logFlag = false;
      // 存储下最早一条的消息时间戳
      var l = data.length;
      if (l) {
        msgTime = data[0].timestamp;
      }
      for (var i = l - 1; i >= 0; i--) {
        showMsg(data[i], true);
      }
      if (l) {
        printWall.scrollTop = printWall.scrollHeight - height;
      }
      if (callback) {
        callback();
      }
    })
    .catch(function(err) {
      console.error(err);
    });
}

// demo 中输出代码
function showLog(msg, data, isBefore) {
  if (data) {
    // console.log(msg, data);
    msg = msg + '<span class="strong">' + data + '</span>';
  }
  var p = document.createElement('p');
  p.innerHTML = msg;
  if (isBefore) {
    printWall.insertBefore(p, printWall.childNodes[0]);
  } else {
    printWall.appendChild(p);
  }
}

function encodeHTML(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(time) {
  var date = new Date(time);
  var month =
    date.getMonth() + 1 < 10
      ? '0' + (date.getMonth() + 1)
      : date.getMonth() + 1;
  var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return (
    date.getFullYear() +
    '-' +
    month +
    '-' +
    currentDate +
    ' ' +
    hh +
    ':' +
    mm +
    ':' +
    ss
  );
}

function createLink(url) {
  return (
    '<a target="_blank" href="' +
    encodeHTML(url) +
    '">' +
    encodeHTML(url) +
    '</a>'
  );
}

function bindEvent(dom, eventName, fun) {
  if (window.addEventListener) {
    dom.addEventListener(eventName, fun);
  } else {
    dom.attachEvent('on' + eventName, fun);
  }
}
function join()
{
  showLog('加入房间');
  myclient.getConversation(jroomid.value)
  .then(function(conversation) {
    room = conversation;
    console.log("getconversation ok")
    return conversation.join();
  })

}
