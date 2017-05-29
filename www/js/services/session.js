app.service('Session', function () {
    this.get = function () {
        if (localStorage.intranetSession || sessionStorage.intranetSession) {
            if (localStorage.intranetSession) {
                return localStorage.intranetSession;
            } else {
                return sessionStorage.intranetSession;
            }
        } else {
            return false;
        }
    }
    this.getPages = function () {
        return JSON.parse(sessionStorage.pages);
    }
    this.setPages = function (data) {
        sessionStorage.pages = JSON.stringify(data);
    }
});
