.pragma library

Qt.include("BaiduService.js");
Qt.include("storage.js");
Qt.include("BaiduParser.js");

var signalCenter, tbsettings, utility, workerScript;
var __name, __bduss, __portrait;
var tbs;

function initialize(sc, ts, ut, ws){
    signalCenter = sc;
    tbsettings = ts;
    utility = ut;
    workerScript = ws;
    if (checkAuthData(tbsettings.currentUid)){
        signalCenter.userChanged();
    } else {
        signalCenter.needAuthorization(true);
    }
}

function checkAuthData(aUid){
    if (tbsettings.clientId.length < 5)
        sync();
    var u = loadAuthData(aUid);
    if (u.length > 0){
        __name = u[0].name;
        __bduss = u[0].BDUSS;
        __portrait = u[0].portrait;
        BaiduConst.BDUSS = __bduss;
        return true;
    }
    return false;
}

function sync(){
    var req = new BaiduRequest(BaiduApi.C_S_Sync);
    var param = {
        msg_status: 1,
        manager_model: 0,
        _active: 0,
        _phone_screen: "640,960",
        _os_version: "6.1.3"
    }
    req.signForm(param);
    function s(obj){ tbsettings.clientId = obj.client.client_id; }
    function f(err){ console.log(err) }
    req.sendRequest(s, f);
}

function login(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_S_Login);
    var param = {
        token: BaiduApi.token,
        isphone: option.isphone?1:0,
        m_api: "/c/s/sync",
        passwd: Qt.btoa(option.passwd),
        un: option.un
    }
    if (option.vcode){
        param.vcode = option.vcode;
        param.vcode_md5 = option.vcode_md5;
    }
    req.signForm(param);
    function s(obj){
        tbs = obj.anti.tbs;
        var user = obj.user;
        tbsettings.currentUid = user.id;
        storeAuthData(user.id, user.name, user.BDUSS, user.passwd, user.portrait);
        __name = user.name;
        __bduss = user.BDUSS;
        __portrait = user.portrait;
        BaiduConst.BDUSS = user.BDUSS;
        signalCenter.userChanged();
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getMessage(onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_S_Msg);
    var param = { bookmark: 1 }
    req.signForm(param);
    req.sendRequest(onSuccess, onFailed);
}

function getRecommentForum(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Forum_Forumrecommend);
    req.signForm();
    function s(obj){
        BaiduParser.loadLikeForum(option.model, obj.like_forum);
        var msg = { func: "storeLikeForum", param: obj.like_forum };
        workerScript.sendMessage(msg);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getForumPage(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Frs_Page);
    var param = {
        rn_need: 30,
        with_group: 1,
        pn: option.pn||1,
        kw: option.kw,
        rn: 90
    }
    if (option.is_good){
        param.is_good = option.is_good;
        param.cid = option.cid;
    }
    req.signForm(param);
    function s(obj){
        tbs = obj.anti.tbs;
        var page = option.page;
        page.user = obj.user;
        page.forum = obj.forum;
        page.totalPage = obj.page.total_page;
        page.currentPage = obj.page.current_page;
        page.hasMore = obj.page.has_more === "1";
        page.hasPrev = obj.page.has_prev === "1";
        page.threadIdList = obj.thread_id_list;
        page.cursor = 0;
        page.curGoodId = obj.page.cur_good_id;
        BaiduParser.loadForumPage(option, obj.thread_list);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getThreadList(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Frs_Threadlist);
    var param = {
        thread_ids: option.thread_ids.join(","),
        forum_id: option.forum_id,
        need_abstract: 1
    }
    req.signForm(param);
    function s(obj){
        var page = option.page;
        page.cursor = option.cursor + obj.thread_list.length;
        BaiduParser.loadForumPage(option, obj.thread_list);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getPhotoPage(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Frs_Photolist);
    var param = {
        an: 30,
        bs: option.bs,
        be: option.be,
        kw: option.kw
    }
    req.signForm(param);
    function s(obj){
        tbs = obj.anti.tbs;
        var page = option.page;
        page.forum = obj.forum;
        var photoData = obj.photo_data;
        page.hasMore = photoData.has_more === "1";
        page.batchStart = photoData.batch_start;
        page.batchEnd = photoData.batch_end;
        page.photolist = photoData.alb_id_list;
        page.cursor = photoData.current_amount;
        BaiduParser.loadForumPicture(option, photoData.thread_list);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getPhotoList(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Frs_Photo);
    var param = {
        alb_ids: option.ids.join(","),
        kw: option.kw
    }
    req.signForm(param);
    function s(obj){
        var list = obj.photo_data.thread_list;
        option.page.cursor += list.length;
        BaiduParser.loadForumPicture(option, list);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getThreadPage(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Pb_Page);
    var param = {
        r: option.r||0,
        pn: option.pn||1,
        rn: 20,
        kz: option.kz
    }
    if (option.lz) param.lz = 1;
    req.signForm(param);
    function s(obj){
        tbs = obj.anti.tbs;
        var modelAffected = BaiduParser.loadThreadPage(option, obj.post_list);
        onSuccess(obj, modelAffected);
    }
    req.sendRequest(s, onFailed);
}

function getComlist(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_S_Comlist);
    var param = {
        pn: option.pn,
        user_id: tbsettings.currentUid,
        rn: 50
    }
    req.signForm(param);
    function s(obj){
        var page = option.page;
        page.hasMore = obj.has_more === "1";
        page.currentPage = option.pn;
        BaiduParser.loadComlist(option, obj.record);
        if (option.renew){
            utility.setUserData("pletter", JSON.stringify(obj));
        }
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getReplyme(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_U_Feed_Replyme);
    var param = {
        uid: tbsettings.currentUid,
        pn: option.pn
    }
    req.signForm(param);
    function s(obj){
        var page = option.page;
        page.hasMore = obj.page.has_more === "1";
        page.currentPage = obj.page.current_page;
        BaiduParser.loadReplyme(option, obj.reply_list);
        if (option.renew){
            utility.setUserData("replyme", JSON.stringify(obj));
        }
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function getAtme(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_U_Feed_Atme);
    var param = {
        uid: tbsettings.currentUid,
        pn: option.pn
    }
    req.signForm(param);
    function s(obj){
        var page = option.page;
        page.hasMore = obj.page.has_more === "1";
        page.currentPage = obj.page.current_page;
        BaiduParser.loadAtme(option, obj.at_list);
        if (option.renew){
            utility.setUserData("atme", JSON.stringify(obj));
        }
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}

function sign(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_C_Forum_Sign);
    var param = {
        fid: option.fid,
        tbs: tbs,
        kw: option.kw,
        uid: tbsettings.currentUid
    }
    req.signForm(param);
    req.sendRequest(onSuccess, onFailed);
}

function likeForum(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_C_Forum_Like);
    var param = {
        fid: option.fid,
        tbs: tbs,
        kw: option.kw
    }
    req.signForm(param);
    req.sendRequest(onSuccess, onFailed);
}

function getFloorPage(option, onSuccess, onFailed){
    var req = new BaiduRequest(BaiduApi.C_F_Pb_Floor);
    var param = {
        pn: option.pn||1,
        pid: option.pid,
        kz: option.kz
    };
    req.signForm(param);
    function s(obj){
        tbs = obj.anti.tbs;
        var page = obj.page;
        page.forum = obj.forum;
        page.thread = obj.thread;
        page.post = obj.post;
        page.currentPage = obj.page.current_page;
        page.pageSize = obj.page.page_size;
        page.totalPage = obj.page.totalPage;
        BaiduParser.loadFloorPage(option, obj.subpost_list);
        onSuccess();
    }
    req.sendRequest(s, onFailed);
}