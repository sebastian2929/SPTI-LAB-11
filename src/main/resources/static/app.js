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

    let stompClient = null;
    let mode = "Point"; // Variable global para almacenar el modo actual

    const addPointToCanvas = function (point) {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    const getMousePosition = function (evt) {
        const canvas = document.getElementById("canvas");
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    const getRandomColor = function () {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    };

    const connectAndSubscribe = function (topic) {
        console.info('Connecting to WS...');
        const socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        // Subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic' + topic, function (eventbody) {
                const pt = JSON.parse(eventbody.body);

                if (topic.includes("newpoint")) {
                    addPointToCanvas(pt);
                } else {
                    const color = getRandomColor();
                    const sketch = new Sketch(pt, color);
                    drawNewSketch(sketch);
                }
            });
        });
    };

    const drawNewSketch = function (sketch) {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = sketch.color;
        for (let i = 1; i < 5; i++) {
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
            const canvas = document.getElementById("canvas");
            if (window.PointerEvent) {
                canvas.addEventListener("pointerdown", function (event) {
                    if (mode !== "Polygon") { // Verificar si el modo actual es "Polygon"
                        const pt = getMousePosition(event);
                        addPointToCanvas(pt);
                        stompClient.send("/app/newpoint", {}, JSON.stringify(pt));
                    }
                });
            }
            // WebSocket connection
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            const pt = new Point(px, py);
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
            const canvas = document.getElementById("canvas");
            const option = document.getElementById("connectionType");
            const drawId = $("#connectionId").val();
            const topic = option.value + drawId;

            alert("Connected to: " + topic);
            connectAndSubscribe(topic);

            if (window.PointerEvent) {
                canvas.addEventListener("pointerdown", function (event) {
                    if (mode !== "Polygon") { // Verificar si el modo actual es "Polygon"
                        const pt = getMousePosition(event);
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
