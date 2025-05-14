// Funkcja rysująca ładną rakietę na canvasie w zadanym punkcie (cx,cy)
// Rozmiar określany przez scale (1 = ~40x60px, 2 = dwa razy większa itd.)
function drawNiceRocket(ctx, cx, cy, scale = 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Cień
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 36, 14, 6, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // Płomienie
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.bezierCurveTo(-7, 44, 7, 44, 0, 34 + 22);
    ctx.bezierCurveTo(-5, 46, 5, 46, 0, 34);
    ctx.closePath();
    ctx.fillStyle = "orange";
    ctx.shadowColor = "orange";
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();

    // Korpus rakiety
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(13, -15, 13, 22, 0, 32);
    ctx.bezierCurveTo(-13, 22, -13, -15, 0, -28);
    ctx.closePath();
    ctx.fillStyle = "#bcdcff";
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#69a";
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Szybka
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -10, 8, 11, 0, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "#e8fbff";
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.strokeStyle = "#77b";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();

    // Pasek na dole
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 25, 11, 5, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#e96";
    ctx.strokeStyle = "#c63";
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Boczne płetwy
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-13, 15);
    ctx.lineTo(-25, 38);
    ctx.lineTo(-6, 28);
    ctx.closePath();
    ctx.fillStyle = "#ff6d3a";
    ctx.strokeStyle = "#a43";
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(13, 15);
    ctx.lineTo(25, 38);
    ctx.lineTo(6, 28);
    ctx.closePath();
    ctx.fillStyle = "#ff6d3a";
    ctx.strokeStyle = "#a43";
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Drugi pasek (ciemniejszy)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 23, 7, 2.5, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#a97";
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

// Przykład użycia (możesz usunąć/commentować ten fragment po testach):
// const canvas = document.getElementById('game');
// const ctx = canvas.getContext('2d');
// drawNiceRocket(ctx, 200, 300, 1);