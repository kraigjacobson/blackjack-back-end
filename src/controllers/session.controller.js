'use strict';

module.exports = function(w, app) {
    app.get('/session', function (req, res) {
        console.log('sup');
        if (req.session) {
            res.send(req.session);
        } else {
            res.sendStatus(401);
        }
    });

    app.post('/login', function (req, res, next) {
        w.services.user.login(req.body.username, req.body.password).then((session) => {
            res.send({
                success: true,
                message: 'Logged in successfully.',
                data: session
            });
        }, (err) => {
            res.status(401);
            next(err);
        });
    });

    app.get('/docs', function (req, res) {
        var html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">' +
            '<title>API Documentation</title>' +
            '</head><body><div class="container">';

        html += '<h2>Available Routes</h2>';
        app._router.stack.forEach((stack) => {
            let route = stack.route;
            if (route) {
                Object.keys(route.methods).forEach(function(method) {
                    html += `<div class="container-fluid well"><h4>${method.toUpperCase()} ${route.path}</h4></div>`;
                });
            }
        });

        html += '</div></body></html>';
        res.send(html);
    });
};