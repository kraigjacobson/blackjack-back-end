'use strict';

module.exports = function(w, app) {
    app.post('/register', function (req, res, next) {
        w.services.user.registerUser(req.body).then((data) => {
            data.user.password = undefined;
            res.send({
                success: true,
                data: data
            });
        }, (err) => {
            res.status(401);
            next(err);
        });
    });
};