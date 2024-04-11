const app = (function () {

    function Point(x, y) {
        const point = {
            x: x,
            y: y,
            toString: function() {
                return `Point(${this.x}, ${this.y})`;
            }
        };
        return point;
    }
    
    function Sketch(points, color) {
        return {
            points: points,
            color: color
        };
    }

    var stompClient = null;
    var mode = "Point"; // Variable global para almacenar el modo actual

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var getRandomColor = function () {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    };

    var connectAndSubscribe = function (topic) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        // Subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic' + topic, function (eventbody) {
                var pt = JSON.parse(eventbody.body);

                if (topic.includes("newpoint")) {
                    addPointToCanvas(pt);
                } else {
                    var color = getRandomColor();
                    var sketch = new Sketch(pt, color);
                    drawNewSketch(sketch);
                }
            });
        });
    };

    var drawNewSketch = function (sketch) {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = sketch.color;
        for (var i = 1; i < 5; i++) {
            if (i == 1) {
                ctx.moveTo(sketch.points[sketch.points.length - i].x, sketch.points[sketch.points.length - i].y);
            } else {
                ctx.lineTo(sketch.points[sketch.points.length - i].x, sketch.points[sketch.points.length - i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
    };

    return {
        init: function () {
            var canvas = document.getElementById("canvas");
            if (window.PointerEvent) {
                canvas.addEventListener("pointerdown", function (event) {
                    if (mode !== "Polygon") { // Verificar si el modo actual es "Polygon"
                        var pt = getMousePosition(event);
                        addPointToCanvas(pt);
                        stompClient.send("/app/newpoint", {}, JSON.stringify(pt));
                    }
                });
            }
            // WebSocket connection
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at " + pt);
            addPointToCanvas(pt);
            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            // Publicar el evento
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        },

        connect: function () {
            var canvas = document.getElementById("canvas");
            var option = document.getElementById("connectionType");
            var drawId = $("#connectionId").val();
            var topic = option.value + drawId;

            alert("Connected to: " + topic);
            connectAndSubscribe(topic);

            if (window.PointerEvent) {
                canvas.addEventListener("pointerdown", function (event) {
                    if (mode !== "Polygon") { // Verificar si el modo actual es "Polygon"
                        var pt = getMousePosition(event);
                        addPointToCanvas(pt);
                        stompClient.send("/app" + topic, {}, JSON.stringify(pt));
                    }
                });
            }
        },

        setMode: function (newMode) { // Función para establecer el modo actual
            mode = newMode;
        }
    };
})();
