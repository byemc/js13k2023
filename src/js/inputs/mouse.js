

export const getMousePos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    let x = evt.clientX - rect.left;
    let y = evt.clientY - rect.top;
    x /= rect.width;
    y /= rect.height;
    x *= canvas.width;
    y *= canvas.height;
    // x /= canvas.camera.scale;
    // y /= canvas.camera.scale;
    return {x,y};
  }

