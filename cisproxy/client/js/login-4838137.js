function getToken() {
    function e() {
        var e = $.Deferred();
        try {
            if (!window.nhsAuth || "function" != typeof nhsAuth.getToken) throw "extension not installed";
            nhsAuth.getToken(function(n, t) {
                if (n instanceof Error) throw n;
                e.reject(t)
            })
        } catch (t) {
            n(), e.resolve("chrome", t)
        }
        return e.promise()
    }

    function n() {
        var e = parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2], 10);
        e < 45 ? $("#chromeJavaWarning").removeClass("hidden") : e > 44 && $("#chromeJavaNotice").removeClass("hidden")
    }

    function t() {
        var e = $.Deferred(),
            n = document.getElementById("idAgentActiveX");
        try {
            var t = n.GetTokenID();
            t ? e.reject(t) : e.resolve("activex", "no token")
        } catch (o) {
            e.resolve("activex", o)
        }
        return e.promise()
    }

    function o() {
        var e = $.Deferred();
        return window.OnSuccess = function() {
            try {
                e.reject(IAD.getTokenID()), sessionStorage.setItem("applet_loaded", "true")
            } catch (n) {
                e.resolve("java", n)
            }
        }, window.OnFailure = function() {
            e.resolve("java")
        }, injectApplet(), e.promise()
    }

    function i() {
        var e = document.getElementById("statusMessage");
        e.className = "textF1S2C18", e.innerHTML = failureMsg
    }
    $.when(e()).then(t).then(o).then(i).fail(login)
}

function injectApplet() {
    $(function() {
        var e = ["<embed id='IAD'", "type='application/x-java-applet' ", "pluginspage='http://java.com/download/' ", "width='0'", "height='0'", "archive='/IdentityAgents/IdentityAgent.jar'", "code='IdentityAgentDrone'", "mayscript='true'", "cmdSuccess='OnSuccess()'", "cmdFailure='OnFailure()'", "/>"].join("");
        document.body.innerHTML += e
    })
}

function login(e) {
    if (e) {
        var n = document.createElement("form");
        n.method = "GET", n.action = "https://wttcujmdph.execute-api.eu-west-2.amazonaws.com/Prod/saml/CognitoSmartcardAuth";
        var t = ["<input type='hidden' name='token' value='", e, "'>"];
        n.innerHTML = t.join(""), document.body.appendChild(n), n.submit()
    }
}