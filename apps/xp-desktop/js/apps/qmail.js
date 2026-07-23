/* ============================================================
   QQ邮箱 (mail.qq.com 2005 怀旧版)
   · 窗口 860x580: 蓝色 banner(账号 + 容量进度条) + 文件夹树 +
     邮件列表 + 阅读区(上下分栏) + 状态栏
   · 收件箱 12 封 2005 年味儿邮件(前 3 封未读: 加粗+蓝点),
     草稿箱 1 封, 垃圾箱 2 封; 部分邮件带附件(假下载)
   · 读信: 回复(预填+引用原文) / 转发 / 删除(进已删除) /
     彻底删除 / 这是垃圾邮件(进垃圾箱); 打开后未读变已读
   · 写信: 假发送进度 → 进已发送; 存草稿 → 进草稿箱(可继续编辑)
   · 已删除/垃圾箱: 还原(回收件箱) 或 彻底删除
   · 状态持久化 localStorage 'winxp_qmail_v1'; 单实例窗口
   · 纯逻辑(邮件状态机)在 Node 下可通过 module.exports 导出测试
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 数据 / 状态机(纯逻辑, 可 Node 测试) ---------------- */
  const STORE_KEY = 'winxp_qmail_v1';
  const ME = { name: '轻舞飞扬', addr: '10001@qq.com' };

  const FOLDERS = [
    { id: 'inbox',    name: '收件箱',   icon: '📥' },
    { id: 'drafts',   name: '草稿箱',   icon: '📝' },
    { id: 'sent',     name: '已发送',   icon: '📤' },
    { id: 'trash',    name: '已删除',   icon: '🗑️' },
    { id: 'spam',     name: '垃圾箱',   icon: '🚫' },
    { id: 'myfolder', name: '我的文件夹', icon: '📁' },
  ];
  function folderName(id) {
    for (let i = 0; i < FOLDERS.length; i++) if (FOLDERS[i].id === id) return FOLDERS[i].name;
    return id;
  }
  function fmtDateTime(d) {
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function defaultMails() {
    return [
      {
        id: 'm01', folder: 'inbox', unread: true,
        from: '腾讯客服', fromAddr: 'service@tencent.com', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: 'QQ会员: 您的会员服务即将到期', date: '2005-08-28 09:12', atts: [],
        body: [
          '尊敬的QQ会员, 您好!',
          '您的QQ会员服务将于 2005年9月2日 到期。到期后, 您的红色昵称、会员魔法表情、聊天记录上传、好友分组扩容等特权将无法继续使用。',
          '现在续费只需 10 Q币/月, 还可获赠会员专属头像挂件一套。登录 my.qq.com 或到附近网吧购买Q币卡即可续费。',
          '感谢您一直以来对腾讯公司的支持!',
          '腾讯公司 客户服务部',
        ],
      },
      {
        id: 'm02', folder: 'inbox', unread: true,
        from: '班长王涛', fromAddr: 'class2002@groups.qq.com', to: '高三(2)班同学群', cc: '',
        subject: '高中同学群邮件: 十年聚会通知', date: '2005-08-27 21:45',
        atts: [{ name: '聚会安排.doc', size: '26K' }],
        body: [
          '各位老同学: 大家好!',
          '一晃高中毕业三年了。班主任李老师提议今年国庆节搞一次同学聚会, 时间暂定10月2日下午5点, 地点在母校旁边那家"老地方"饭馆, 就是咱们散伙饭那家。',
          '能来的同学请在群里回复, 或者直接给我回邮件, 我好统计人数订包间。费用AA制, 预计每人50元左右。',
          '初步的活动安排我整理成文档放在附件里了, 大家看看有什么建议。李老师说他也会来, 咱们好好热闹热闹!',
          '班长 王涛',
        ],
      },
      {
        id: 'm03', folder: 'inbox', unread: true,
        from: '幸运抽奖中心', fromAddr: 'lucky2005@163.com', to: '10001@qq.com', cc: '',
        subject: '【系统通知】您中奖了! 索尼PS2一台!', date: '2005-08-27 14:03', atts: [],
        body: [
          '尊敬的QQ用户: 恭喜您!',
          '您的QQ号码在"腾讯十周年感恩大回馈"全国抽奖活动中被系统随机抽中, 获得 索尼PS2游戏机一台 + Q币500个, 总价值人民币 2888 元!',
          '请立即登录活动网站填写您的真实姓名、身份证号、银行账号及密码, 以便我们为您发放奖品。领奖需先缴纳 200 元手续费, 逾期视为自动放弃!',
          '郑重声明: 本活动绝对真实有效, 请勿错过千载难逢的好机会!(注: 腾讯官方从未举办此类活动, 请广大用户提高警惕, 谨防上当受骗。)',
          '"腾讯十周年"活动组委会',
        ],
      },
      {
        id: 'm04', folder: 'inbox', unread: false,
        from: '网易通行证', fromAddr: 'passport@service.163.com', to: 'qingwu@163.com', cc: '',
        subject: '网易: 通行证密码找回', date: '2005-08-26 18:32', atts: [],
        body: [
          '您好!',
          '我们收到了您提交的密码找回请求。您的网易通行证(qingwu@163.com)密码已重置为临时密码: 8x3Kp9',
          '请尽快使用临时密码登录, 并在"修改密码"页面设置您的新密码。如果这不是您本人的操作, 请立即冻结账号并联系网易客服。',
          '网易公司',
        ],
      },
      {
        id: 'm05', folder: 'inbox', unread: false,
        from: '新浪博客', fromAddr: 'blog@sina.com.cn', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: '新浪博客: 有人评论了你的博文', date: '2005-08-26 10:20', atts: [],
        body: [
          '亲爱的 轻舞飞扬:',
          '网友"追风少年"评论了您的博文《今晚的月亮真圆》:',
          '"写得真好, 顶一个! 博主文采不错, 有空来我博客踩踩, 记得回踩哦~"',
          '登录新浪博客查看完整评论并回复。新浪博客, 记录你的生活。',
        ],
      },
      {
        id: 'm06', folder: 'inbox', unread: false,
        from: '卓越网', fromAddr: 'order@joyo.com', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: '卓越网: 您的订单已发货', date: '2005-08-25 16:08',
        atts: [{ name: '订单详单.txt', size: '2K' }],
        body: [
          '尊敬的客户, 您好!',
          '您在卓越网订购的商品已于 2005年8月25日 发货, 承运快递: 申通快递, 预计 2-3 天送达, 请保持电话畅通。',
          '订单商品: 《七龙珠》全套漫画(珍藏版) x1、任贤齐《对面的女孩看过来》CD x1, 合计 ￥86.00(货到付款)。',
          '感谢您在卓越网购物, 欢迎再次光临!',
          '卓越网 joyo.com',
        ],
      },
      {
        id: 'm07', folder: 'inbox', unread: false,
        from: '妈妈', fromAddr: 'wangxiu@tom.com', to: '儿子 <10001@qq.com>', cc: '',
        subject: '天冷了多穿衣服', date: '2005-08-25 08:40', atts: [],
        body: [
          '儿子:',
          '北京开始降温了吧? 天气预报说你们那边这几天要下雨, 记得把上次从家里带去的毛衣穿上, 别为了好看冻感冒了。',
          '钱还够花吗? 不够就打电话回家, 别省着不吃饭。少去网吧熬夜, 对身体不好。你爸让我问你国庆节回不回来, 回来的话提前说, 妈给你包饺子。',
          '妈妈',
        ],
      },
      {
        id: 'm08', folder: 'inbox', unread: false,
        from: 'QQ空间', fromAddr: 'qzone@tencent.com', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: 'QQ空间: 有人给你留言了', date: '2005-08-24 22:15', atts: [],
        body: [
          '轻舞飞扬, 你好:',
          '你的好友 水晶之恋 在你的QQ空间留言板给你留言了:',
          '"踩踩踩! 空间装扮得真漂亮, 背景音乐也好听, 是哪首歌呀? 记得回踩我哦~"',
          '登录QQ空间(qzone.qq.com)即可回复留言。',
        ],
      },
      {
        id: 'm09', folder: 'inbox', unread: false,
        from: '问道客服', fromAddr: 'service@gyyx.cn', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: '问道: 您充值的点卡已到账', date: '2005-08-24 19:35', atts: [],
        body: [
          '尊敬的问道玩家:',
          '您于 2005年8月24日 19:32 充值的 30元点卡(3000问道币)已成功到账, 游戏账号: qingwu10001。',
          '您当前的账户余额为 3280 问道币。祝您游戏愉快, 早日抓到满成长宝宝!',
          '光宇华夏《问道》运营团队',
        ],
      },
      {
        id: 'm10', folder: 'inbox', unread: false,
        from: '学习委员陈静', fromAddr: 'xuexiwei@sina.com', to: '全班同学', cc: '',
        subject: '期末考试复习资料', date: '2005-08-23 15:50',
        atts: [{ name: '高数复习题.doc', size: '48K' }, { name: '去年真题.doc', size: '35K' }],
        body: [
          '同学们:',
          '这是张老师划的高数重点, 还有去年的考试真题, 我整理成两个文档放在附件里了, 大家打印出来抓紧看。',
          '考试时间是9月8日上午, 二教301教室。听说今年题目会比较难, 这阵子网吧就别去了, 考完再通宵也不迟。',
          '学习委员 陈静',
        ],
      },
      {
        id: 'm11', folder: 'inbox', unread: false,
        from: '榕树下', fromAddr: 'editor@rongshuxia.com', to: '轻舞飞扬 <10001@qq.com>', cc: '',
        subject: '榕树下: 您的文章已通过审核', date: '2005-08-22 11:26', atts: [],
        body: [
          '轻舞飞扬, 您好:',
          '您投稿的散文《网吧的深夜》已通过编辑审核, 发表在"随笔小札"栏目。',
          '截至目前, 您的文章已有 23 人阅读, 收到 4 条评论。感谢您对榕树下中文原创网站的支持!',
          '榕树下编辑部',
        ],
      },
      {
        id: 'm12', folder: 'inbox', unread: false,
        from: '痞子蔡', fromAddr: 'pizicai@263.net', to: '飞扬 <10001@qq.com>', cc: '',
        subject: '周末去网吧通宵?', date: '2005-08-21 20:05',
        atts: [{ name: '照片.jpg', size: '128K' }],
        body: [
          '飞扬:',
          '周六晚上老地方网吧通宵, 打CS, 五缺一, 你来不来?',
          '胖子他们都来。老板说通宵15块钱还送泡面, 晚上10点到就行。上次咱们队差一局就翻盘了, 这次必须赢回来!',
          '来的话回个邮件, 我好给你留机子。',
          '蔡',
        ],
      },
      {
        id: 'd01', folder: 'drafts', unread: false,
        from: ME.name, fromAddr: ME.addr, to: '水晶之恋 <5201314@qq.com>', cc: '',
        subject: '周末一起去溜冰', date: '2005-08-27 23:10', atts: [],
        body: [
          '水晶之恋, 你好:',
          '听说文化中心的溜冰场新开业了, 这个周末要不要一起去?',
          '(还没写完……)',
        ],
      },
      {
        id: 's01', folder: 'spam', unread: true,
        from: '中奖信息中心', fromAddr: 'award@126.com', to: '10001@qq.com', cc: '',
        subject: '恭喜您获得QQ靓号保护大奖!', date: '2005-08-26 03:14', atts: [],
        body: [
          '尊敬的用户:',
          '您的QQ号码被抽选为今日幸运号码, 获得"五位QQ靓号"一个及笔记本电脑一台! 请速与我们联系, 缴纳 200 元手续费后即可领取。',
          '逾期不领, 奖品将转赠他人, 切勿错过!',
        ],
      },
      {
        id: 's02', folder: 'spam', unread: true,
        from: '免费影院', fromAddr: 'movie@freemov.com', to: '10001@qq.com', cc: '',
        subject: '免费观看最新港台大片, 无需注册!', date: '2005-08-25 01:47', atts: [],
        body: [
          '最新大片《头文字D》《七剑》《神话》在线免费观看, 无需注册, 高速不卡!',
          '本站另有大量精彩图片和铃声下载, 每条仅收 2 元信息费。',
        ],
      },
    ];
  }
  function freshState() { return { v: 1, seq: 100, mails: defaultMails() }; }

  function findMail(state, id) {
    for (let i = 0; i < state.mails.length; i++) if (state.mails[i].id === id) return state.mails[i];
    return null;
  }
  function mailsIn(state, folder) { return state.mails.filter(m => m.folder === folder); }
  // 计数: 收件箱显示未读数, 其余文件夹显示邮件总数
  function folderCounts(state) {
    const c = { inbox: 0, drafts: 0, sent: 0, trash: 0, spam: 0, myfolder: 0, inboxTotal: 0 };
    state.mails.forEach(m => {
      if (!(m.folder in c)) return;
      if (m.folder === 'inbox') { c.inboxTotal++; if (m.unread) c.inbox++; }
      else c[m.folder]++;
    });
    return c;
  }
  function markRead(state, id) {
    const m = findMail(state, id);
    if (m && m.unread) { m.unread = false; return true; }
    return false;
  }
  // 删除: 移入"已删除"; 已在已删除里则等同于彻底删除
  function softDelete(state, id) {
    const m = findMail(state, id);
    if (!m) return false;
    if (m.folder === 'trash') return purgeMail(state, id);
    m.folder = 'trash';
    return true;
  }
  function purgeMail(state, id) {
    const i = state.mails.findIndex(m => m.id === id);
    if (i < 0) return false;
    state.mails.splice(i, 1);
    return true;
  }
  function markSpam(state, id) {
    const m = findMail(state, id);
    if (!m) return false;
    m.folder = 'spam';
    return true;
  }
  // 从已删除/垃圾箱还原回收件箱
  function restoreMail(state, id) {
    const m = findMail(state, id);
    if (!m) return false;
    m.folder = 'inbox';
    return true;
  }
  function moveToFolder(state, id, folder) {
    const m = findMail(state, id);
    if (!m) return false;
    m.folder = folder;
    return true;
  }
  function sendMail(state, draft, now) {
    const mail = {
      id: 'u' + (state.seq++), folder: 'sent', unread: false,
      from: ME.name, fromAddr: ME.addr,
      to: draft.to || '', cc: draft.cc || '',
      subject: draft.subject || '（无主题）',
      date: fmtDateTime(now || new Date()),
      body: String(draft.body || '').split('\n').filter((l, i, a) => !(l === '' && (i === 0 || i === a.length - 1))),
      atts: [],
    };
    state.mails.unshift(mail);
    return mail;
  }
  // 存草稿: draft.id 已存在则更新, 否则新建
  function saveDraft(state, draft, now) {
    let m = draft.id ? findMail(state, draft.id) : null;
    if (m && m.folder === 'drafts') {
      m.to = draft.to || ''; m.cc = draft.cc || '';
      m.subject = draft.subject || '（无主题）';
      m.body = String(draft.body || '').split('\n');
      m.date = fmtDateTime(now || new Date());
      return m;
    }
    m = {
      id: 'u' + (state.seq++), folder: 'drafts', unread: false,
      from: ME.name, fromAddr: ME.addr,
      to: draft.to || '', cc: draft.cc || '',
      subject: draft.subject || '（无主题）',
      date: fmtDateTime(now || new Date()),
      body: String(draft.body || '').split('\n'),
      atts: [],
    };
    state.mails.unshift(m);
    return m;
  }

  /* ---------------- Node 测试导出(浏览器中 module 未定义, 自动跳过) ---------------- */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      STORE_KEY, ME, FOLDERS, folderName, fmtDateTime, freshState,
      findMail, mailsIn, folderCounts, markRead, softDelete, purgeMail,
      markSpam, restoreMail, moveToFolder, sendMail, saveDraft,
    };
    return;
  }
  if (typeof window === 'undefined' || !window.XP) return;

  /* ---------------- CSS 注入(类名统一前缀 app-qm-) ---------------- */
  const CSS = `
.app-qm-root{display:flex;flex-direction:column;height:100%;background:#fff;font-size:12px;color:#000}
.app-qm-banner{flex:none;display:flex;align-items:center;padding:0 14px;height:58px;background:linear-gradient(180deg,#4a9be8 0%,#2c7fd8 55%,#1e6bc4 100%);border-bottom:2px solid #145aa8;color:#fff}
.app-qm-logo{font-size:24px;font-weight:bold;text-shadow:1px 2px 2px rgba(0,0,0,.4);letter-spacing:1px;white-space:nowrap}
.app-qm-logo .ico{font-size:26px;vertical-align:-2px;margin-right:4px}
.app-qm-logo .beta{font-size:11px;font-weight:normal;background:#ff8c00;border-radius:3px;padding:0 4px;margin-left:4px;vertical-align:2px}
.app-qm-banner-right{margin-left:auto;text-align:right;font-size:11px;line-height:1.6}
.app-qm-user{font-weight:bold}
.app-qm-user a{color:#ffe9a8;cursor:pointer}
.app-qm-cap{display:flex;align-items:center;gap:6px;justify-content:flex-end;color:#dcecff}
.app-qm-cap-bar{width:110px;height:10px;border:1px solid #0e4f96;background:#0e4f96;border-radius:2px;overflow:hidden}
.app-qm-cap-bar>div{height:100%;background:linear-gradient(180deg,#a8e05f,#5cb030)}
.app-qm-main{flex:1;display:flex;overflow:hidden}
.app-qm-folders{flex:none;width:152px;background:#f5f8ff;border-right:1px solid #b8c8e0;overflow-y:auto;padding:4px 0}
.app-qm-folder{display:flex;align-items:center;gap:5px;padding:4px 10px;cursor:pointer;white-space:nowrap;color:#1a3a6b}
.app-qm-folder:hover{background:#cfe0fa}
.app-qm-folder.active{background:#316ac5;color:#fff;font-weight:bold}
.app-qm-folder .ico{font-size:13px}
.app-qm-folder .nm{flex:1;overflow:hidden;text-overflow:ellipsis}
.app-qm-folder .ct{font-size:11px;color:#0046d5}
.app-qm-folder.active .ct{color:#cfe4ff}
.app-qm-folder .ct.zero{color:#9aa}
.app-qm-right{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;min-width:0}
.app-qm-listwrap{flex:none;height:46%;overflow-y:auto;border-bottom:2px solid #7f9db9;background:#fff}
.app-qm-lhead{display:flex;position:sticky;top:0;background:linear-gradient(180deg,#f7f5ee,#e3dfd0);border-bottom:1px solid #c8c4b4;color:#444;font-size:11px;z-index:1}
.app-qm-lhead>div{padding:3px 6px}
.app-qm-row{display:flex;align-items:center;padding:3px 4px 3px 6px;border-bottom:1px solid #eee;cursor:default;white-space:nowrap}
.app-qm-row:hover{background:#eaf2fd}
.app-qm-row.sel{background:#316ac5;color:#fff}
.app-qm-row.unread{font-weight:bold}
.app-qm-dot{flex:none;width:10px;text-align:center;color:#0050e0;font-size:11px}
.app-qm-row.sel .dot{color:#bcd4ff}
.app-qm-from{flex:none;width:142px;overflow:hidden;text-overflow:ellipsis;padding-right:6px}
.app-qm-subj{flex:1;overflow:hidden;text-overflow:ellipsis}
.app-qm-subj .att{margin-left:4px;color:#a07000}
.app-qm-row.sel .att{color:#ffe9a8}
.app-qm-subj .dft{color:#c1440e}
.app-qm-row.sel .dft{color:#ffd9c0}
.app-qm-date{flex:none;width:104px;text-align:right;color:#666;font-size:11px;padding-right:4px}
.app-qm-row.sel .app-qm-date{color:#dce8fb}
.app-qm-empty{padding:26px 0;text-align:center;color:#999}
.app-qm-reader{flex:1;overflow-y:auto;padding:10px 16px;background:#fff}
.app-qm-reader-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#b8c4d8;font-size:14px;flex-direction:column;gap:8px}
.app-qm-reader-empty .big{font-size:40px}
.app-qm-r-subj{font-size:16px;font-weight:bold;color:#003c74;margin-bottom:8px;word-break:break-all}
.app-qm-r-meta{background:#f5f8ff;border:1px solid #d8e4f8;border-radius:3px;padding:6px 10px;margin-bottom:8px;line-height:1.7;color:#333}
.app-qm-r-meta .lb{display:inline-block;width:48px;color:#778}
.app-qm-r-actions{display:flex;gap:6px;flex-wrap:wrap;padding-bottom:8px;border-bottom:1px solid #e8e8e0;margin-bottom:10px}
.app-qm-r-body{line-height:1.9;color:#222;font-size:12px;word-break:break-all}
.app-qm-r-body p{margin:6px 0;text-indent:2em;min-height:12px}
.app-qm-r-atts{margin-top:14px;border-top:1px dashed #c8c8c0;padding-top:8px}
.app-qm-r-atts .t{font-weight:bold;color:#555;margin-bottom:4px}
.app-qm-att{display:flex;align-items:center;gap:6px;padding:3px 0}
.app-qm-att .nm{color:#003c74}
.app-qm-att .sz{color:#999;font-size:11px}
.app-qm-att .dl{color:#0046d5;cursor:pointer;text-decoration:underline;font-size:11px}
.app-qm-att .dl:hover{color:#c1440e}
.app-qm-compose{display:flex;flex-direction:column;height:100%;background:#fff}
.app-qm-c-head{flex:none;display:flex;align-items:center;gap:8px;padding:6px 10px;background:linear-gradient(180deg,#f7f5ee,#e3dfd0);border-bottom:1px solid #c8c4b4}
.app-qm-c-title{font-weight:bold;color:#003c74;font-size:13px;flex:1}
.app-qm-c-row{flex:none;display:flex;align-items:center;padding:4px 10px;gap:6px}
.app-qm-c-row .lb{flex:none;width:48px;text-align:right;color:#555}
.app-qm-c-row .xp-input{flex:1}
.app-qm-c-body{flex:1;margin:4px 10px 10px;resize:none;font-family:inherit;line-height:1.7}
.app-qm-overlay{position:absolute;inset:0;z-index:20;background:rgba(255,255,255,.78);display:flex;align-items:center;justify-content:center}
.app-qm-sendbox{background:#fff;border:2px solid #2c7fd8;border-radius:6px;padding:18px 26px;text-align:center;box-shadow:2px 3px 12px rgba(0,0,0,.3)}
.app-qm-sendbox .t{color:#003c74;font-weight:bold;margin-bottom:10px}
.app-qm-sendbox .xp-progress{width:220px;margin:0 auto}
`;
  if (!document.getElementById('app-qm-style')) {
    const st = document.createElement('style');
    st.id = 'app-qm-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = XP.el;

  /* ---------------- 状态(localStorage 持久化) ---------------- */
  let qmWin = null;   // 单实例
  let state = null;
  function loadState() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY));
      if (v && Array.isArray(v.mails)) return v;
    } catch (e) {}
    return freshState();
  }
  function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  XP.registerApp({ id: 'qmail', name: 'QQ邮箱', icon: '📧', desktop: false, open: openQMail });

  /* ---------------- 主窗口 ---------------- */
  function openQMail() {
    if (qmWin && !qmWin.closed) { qmWin.focus(); return; }
    state = loadState();
    const win = qmWin = XP.createWindow({ title: 'QQ邮箱 - 10001@qq.com', icon: '📧', width: 860, height: 580 });
    win.body.style.cssText = 'padding:0;overflow:hidden;display:flex;flex-direction:column;';
    const root = el('div', { class: 'app-qm-root' });
    win.body.appendChild(root);

    /* 顶部 banner */
    root.appendChild(el('div', { class: 'app-qm-banner' }, [
      el('div', { class: 'app-qm-logo', html: '<span class="ico">✉️</span>QQ邮箱<span class="beta">Beta</span>' }),
      el('div', { class: 'app-qm-banner-right' }, [
        el('div', { class: 'app-qm-user', html: '轻舞飞扬 &lt;10001@qq.com&gt; | <a title="假的, 点不动">设置</a> | <a title="假的, 点不动">换肤</a>' }),
        el('div', { class: 'app-qm-cap' }, [
          el('span', { text: '容量: 已用 28M / 1G' }),
          el('div', { class: 'app-qm-cap-bar' }, [el('div', { style: { width: '2.8%' } })]),
        ]),
      ]),
    ]));

    /* 工具栏 */
    root.appendChild(el('div', { class: 'xp-toolbar' }, [
      el('div', { class: 'xp-tool-btn', html: '✏️ <b>写信</b>', onclick: () => showCompose({}) }),
      el('div', { class: 'xp-tool-btn', html: '📥 收信', onclick: checkNewMail }),
      el('div', { class: 'xp-tool-btn', html: '📧 邮件助理', onclick: () => XP.notify('QQ邮箱', '邮件助理: 您没有设置任何过滤规则') }),
    ]));

    /* 主体: 文件夹树 + 右侧(列表+阅读区/写信) */
    const folderRows = {};
    const foldersEl = el('div', { class: 'app-qm-folders' }, FOLDERS.map(f => {
      const row = el('div', { class: 'app-qm-folder', onclick: () => switchFolder(f.id) }, [
        el('span', { class: 'ico', text: f.icon }),
        el('span', { class: 'nm', text: f.name }),
        el('span', { class: 'ct' }),
      ]);
      folderRows[f.id] = row;
      return row;
    }));
    const rightEl = el('div', { class: 'app-qm-right' });
    const listWrap = el('div', { class: 'app-qm-listwrap' });
    const readerEl = el('div', { class: 'app-qm-reader' });
    rightEl.appendChild(listWrap);
    rightEl.appendChild(readerEl);
    root.appendChild(el('div', { class: 'app-qm-main' }, [foldersEl, rightEl]));

    /* 状态栏 */
    const sbText = el('span', { text: '' });
    root.appendChild(el('div', { class: 'xp-statusbar' }, [
      sbText,
      el('span', { class: 'sb-cell', text: '已用 28M / 1G (2.7%)' }),
    ]));

    let curFolder = 'inbox';
    let selId = null;

    function updateCounts() {
      const c = folderCounts(state);
      FOLDERS.forEach(f => {
        const n = c[f.id] || 0;
        const ct = folderRows[f.id].querySelector('.ct');
        ct.textContent = n > 0 ? '(' + n + ')' : '';
        ct.classList.toggle('zero', n === 0);
        folderRows[f.id].classList.toggle('active', f.id === curFolder);
      });
      let st = '当前文件夹: ' + folderName(curFolder);
      const list = mailsIn(state, curFolder);
      if (curFolder === 'inbox') st += ' | 共 ' + c.inboxTotal + ' 封邮件, 其中未读 ' + c.inbox + ' 封';
      else st += ' | 共 ' + list.length + ' 封邮件';
      sbText.textContent = st;
    }

    function personCol(m) {
      if (m.folder === 'sent' || m.folder === 'drafts') return m.to || '（未填写）';
      return m.from + (m.fromAddr ? ' <' + m.fromAddr + '>' : '');
    }

    function renderList() {
      listWrap.innerHTML = '';
      const headFrom = (curFolder === 'sent' || curFolder === 'drafts') ? '收件人' : '发件人';
      listWrap.appendChild(el('div', { class: 'app-qm-lhead' }, [
        el('div', { style: { width: '10px' } }),
        el('div', { style: { width: '142px' }, text: headFrom }),
        el('div', { style: { flex: '1' }, text: '主题' }),
        el('div', { style: { width: '104px', textAlign: 'right' }, text: '日期' }),
      ]));
      const list = mailsIn(state, curFolder);
      if (!list.length) {
        listWrap.appendChild(el('div', { class: 'app-qm-empty', text: '该文件夹暂无邮件' }));
        return;
      }
      list.forEach(m => {
        const row = el('div', {
          class: 'app-qm-row' + (m.unread ? ' unread' : '') + (m.id === selId ? ' sel' : ''),
          onclick: () => openMail(m.id),
          ondblclick: () => { if (m.folder === 'drafts') editDraft(m.id); },
        }, [
          el('span', { class: 'app-qm-dot dot', text: m.unread ? '●' : '' }),
          el('span', { class: 'app-qm-from', text: personCol(m) }),
          el('span', {
            class: 'app-qm-subj',
            html: (m.folder === 'drafts' ? '<span class="dft">[草稿]</span> ' : '') +
              escapeHtml(m.subject || '（无主题）') +
              (m.atts && m.atts.length ? ' <span class="att">📎</span>' : ''),
          }),
          el('span', { class: 'app-qm-date', text: m.date.slice(5) }),
        ]);
        listWrap.appendChild(row);
      });
    }

    function renderReader(m) {
      readerEl.innerHTML = '';
      if (!m) {
        readerEl.appendChild(el('div', { class: 'app-qm-reader-empty' }, [
          el('div', { class: 'big', text: '📭' }),
          el('div', { text: '从上方列表中选择一封邮件进行阅读' }),
        ]));
        return;
      }
      const acts = actionsFor(m);
      readerEl.appendChild(el('div', { class: 'app-qm-r-subj', text: m.subject || '（无主题）' }));
      const metaRows = [
        ['发件人', m.from + (m.fromAddr ? ' <' + m.fromAddr + '>' : '')],
        ['收件人', m.to || '（未填写）'],
      ];
      if (m.cc) metaRows.push(['抄送', m.cc]);
      metaRows.push(['时间', m.date]);
      readerEl.appendChild(el('div', { class: 'app-qm-r-meta' }, metaRows.map(r =>
        el('div', {}, [el('span', { class: 'lb', text: r[0] + ':' }), el('span', { text: r[1] })])
      )));
      readerEl.appendChild(el('div', { class: 'app-qm-r-actions' }, acts.map(a =>
        el('button', { class: 'xp-btn', text: a.label, onclick: a.fn })
      )));
      readerEl.appendChild(el('div', { class: 'app-qm-r-body' }, (m.body || []).map(p =>
        el('p', { text: p })
      )));
      if (m.atts && m.atts.length) {
        readerEl.appendChild(el('div', { class: 'app-qm-r-atts' }, [
          el('div', { class: 't', text: '附件 (' + m.atts.length + ' 个)' }),
        ].concat(m.atts.map(att =>
          el('div', { class: 'app-qm-att' }, [
            el('span', { text: '📎' }),
            el('span', { class: 'nm', text: att.name }),
            el('span', { class: 'sz', text: '(' + att.size + ')' }),
            el('span', { class: 'dl', text: '下载', onclick: () => downloadAtt(att) }),
          ])
        ))));
      }
    }

    function actionsFor(m) {
      const f = m.folder;
      const A = [];
      const act = (label, fn) => A.push({ label, fn });
      if (f === 'inbox' || f === 'myfolder') {
        act('回复', () => replyMail(m));
        act('转发', () => forwardMail(m));
        act('删除', () => doSoftDelete(m));
        act('彻底删除', () => doPurge(m));
        act('这是垃圾邮件', () => doSpam(m));
        if (f === 'inbox') act('移动到我的文件夹', () => doMove(m, 'myfolder', '已移动到"我的文件夹"'));
      } else if (f === 'sent') {
        act('转发', () => forwardMail(m));
        act('删除', () => doSoftDelete(m));
        act('彻底删除', () => doPurge(m));
      } else if (f === 'drafts') {
        act('继续编辑', () => editDraft(m.id));
        act('彻底删除', () => doPurge(m));
      } else if (f === 'trash') {
        act('还原', () => doRestore(m));
        act('彻底删除', () => doPurge(m));
      } else if (f === 'spam') {
        act('这不是垃圾邮件', () => doRestore(m));
        act('彻底删除', () => doPurge(m));
      }
      return A;
    }

    /* ---------------- 邮件操作 ---------------- */
    function openMail(id) {
      selId = id;
      if (markRead(state, id)) saveState();
      renderList();
      updateCounts();
      renderReader(findMail(state, id));
    }
    function switchFolder(fid) {
      curFolder = fid;
      selId = null;
      showListMode();
      renderList();
      renderReader(null);
      updateCounts();
    }
    function afterChange(msg) {
      selId = null;
      saveState();
      renderList();
      renderReader(null);
      updateCounts();
      if (msg) XP.notify('QQ邮箱', msg);
    }
    function doSoftDelete(m) { softDelete(state, m.id); afterChange('邮件已移到"已删除"'); }
    function doSpam(m) { markSpam(state, m.id); afterChange('已标记为垃圾邮件, 移入"垃圾箱"'); }
    function doRestore(m) { restoreMail(state, m.id); afterChange('邮件已还原到"收件箱"'); }
    function doMove(m, folder, msg) { moveToFolder(state, m.id, folder); afterChange(msg); }
    function doPurge(m) {
      if (!window.confirm('确定要彻底删除这封邮件吗?\n删除后将无法恢复。')) return;
      purgeMail(state, m.id);
      afterChange('邮件已彻底删除');
    }
    function downloadAtt(att) {
      XP.notify('开始下载', att.name + ' 正在下载……');
      setTimeout(() => {
        if (win.closed) return;
        XP.notify('下载完成', att.name + ' 已保存到 C:\\我的文档\\下载 (' + att.size + ')');
        XP.sound('ding');
      }, 1400);
    }
    function checkNewMail() {
      XP.notify('QQ邮箱', '正在连接 mail.qq.com 接收新邮件……');
      setTimeout(() => {
        if (win.closed) return;
        XP.notify('QQ邮箱', '接收完毕: 没有新邮件');
      }, 1100);
    }

    /* ---------------- 回复 / 转发 ---------------- */
    function quoteBlock(m, title) {
      return '\n\n------------------ ' + title + ' ------------------\n' +
        '发件人: ' + m.from + (m.fromAddr ? ' <' + m.fromAddr + '>' : '') + '\n' +
        '发送时间: ' + m.date + '\n' +
        '主题: ' + (m.subject || '（无主题）') + '\n\n' +
        (m.body || []).map(l => '> ' + l).join('\n');
    }
    function replyMail(m) {
      showCompose({
        to: m.from + (m.fromAddr ? ' <' + m.fromAddr + '>' : ''),
        subject: 'Re: ' + (m.subject || ''),
        body: quoteBlock(m, '原始邮件'),
      });
    }
    function forwardMail(m) {
      showCompose({
        subject: 'Fw: ' + (m.subject || ''),
        body: quoteBlock(m, '转发邮件'),
      });
    }
    function editDraft(id) {
      const m = findMail(state, id);
      if (!m) return;
      showCompose({ editId: m.id, to: m.to, cc: m.cc, subject: m.subject, body: (m.body || []).join('\n') });
    }

    /* ---------------- 写信视图 ---------------- */
    let composeEl = null;
    function showListMode() {
      if (composeEl) { composeEl.remove(); composeEl = null; }
      listWrap.style.display = '';
      readerEl.style.display = '';
    }
    function showCompose(opts) {
      opts = opts || {};
      listWrap.style.display = 'none';
      readerEl.style.display = 'none';
      if (composeEl) composeEl.remove();
      const toIn = el('input', { class: 'xp-input', type: 'text', value: opts.to || '', placeholder: '例: 好友 <123456@qq.com>' });
      const ccIn = el('input', { class: 'xp-input', type: 'text', value: opts.cc || '' });
      const subjIn = el('input', { class: 'xp-input', type: 'text', value: opts.subject || '' });
      const bodyIn = el('textarea', { class: 'xp-textarea app-qm-c-body', text: opts.body || '' });
      composeEl = el('div', { class: 'app-qm-compose' }, [
        el('div', { class: 'app-qm-c-head' }, [
          el('span', { class: 'app-qm-c-title', text: opts.editId ? '✏️ 编辑草稿' : '✏️ 写信' }),
          el('button', { class: 'xp-btn', text: '发送', onclick: doSend }),
          el('button', { class: 'xp-btn', text: '存草稿', onclick: doSaveDraft }),
          el('button', { class: 'xp-btn', text: '取消', onclick: () => { showListMode(); renderList(); updateCounts(); } }),
        ]),
        el('div', { class: 'app-qm-c-row' }, [el('span', { class: 'lb', text: '收件人:' }), toIn]),
        el('div', { class: 'app-qm-c-row' }, [el('span', { class: 'lb', text: '抄送:' }), ccIn]),
        el('div', { class: 'app-qm-c-row' }, [el('span', { class: 'lb', text: '主题:' }), subjIn]),
        bodyIn,
      ]);
      rightEl.appendChild(composeEl);
      if (!opts.editId && !opts.to) toIn.focus(); else bodyIn.focus();

      function collect() {
        return {
          to: toIn.value.trim(), cc: ccIn.value.trim(),
          subject: subjIn.value.trim(), body: bodyIn.value,
        };
      }
      function doSend() {
        const d = collect();
        if (!d.to) { XP.notify('QQ邮箱', '请填写收件人'); toIn.focus(); return; }
        // 假发送进度
        const bar = el('div', { style: { width: '0%' } });
        const ov = el('div', { class: 'app-qm-overlay' }, [
          el('div', { class: 'app-qm-sendbox' }, [
            el('div', { class: 't', text: '正在发送邮件, 请稍候……' }),
            el('div', { class: 'xp-progress' }, [bar]),
          ]),
        ]);
        rightEl.appendChild(ov);
        let step = 0;
        const steps = 6;
        (function tick() {
          step++;
          if (win.closed) { finish(); return; }
          bar.style.width = Math.min(100, Math.round(step / steps * 100)) + '%';
          if (step < steps) { setTimeout(tick, 230); return; }
          finish();
        })();
        function finish() {
          sendMail(state, d, new Date());
          if (opts.editId) purgeMail(state, opts.editId);
          saveState();
          XP.notify('QQ邮箱', '邮件已成功发送到 ' + d.to);
          XP.sound('ding');
          if (win.closed) return;
          ov.remove();
          showListMode();
          renderList();
          renderReader(null);
          updateCounts();
        }
      }
      function doSaveDraft() {
        const d = collect();
        d.id = opts.editId;
        saveDraft(state, d, new Date());
        saveState();
        XP.notify('QQ邮箱', '邮件已保存到"草稿箱"');
        showListMode();
        renderList();
        updateCounts();
      }
    }

    /* ---------------- 初始化 ---------------- */
    renderList();
    renderReader(null);
    updateCounts();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
})();
