// ----------------------------------------------------------------------------
// File: ThreeJsCamera.js
//
// Copyright (c) 2013 VoodooJs Authors
// ----------------------------------------------------------------------------



/**
 * The ThreeJs virtual camera that aligns 3D coordinates with 2D pixels.
 *
 * @constructor
 * @private
 *
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {number} fovY Camera field of view in degrees along the y axis.
 * @param {number} zNear Minimum z distance rendered.
 * @param {number} zFar Maximum z distance rendered.
 */
function ThreeJsCamera_(canvas, fovY, zNear, zFar) {
  log_.information_('Creating ThreeJs Camera');
  this.camera_ = new THREE.Camera();

  this.canvas_ = canvas;
  this.fovY_ = fovY;
  this.zNear_ = zNear;
  this.zFar_ = zFar;

  this.pendingScroll_ = false;
  this.pendingResize_ = false;

  this.init_();

  // Setup properties
  Object.defineProperty(this, 'fovy', {
    get: function() { return this.fovY_; },
    set: function() { log_.error_('fovy is read-only'); },
    writeable: false
  });
  Object.defineProperty(this, 'position', {
    get: function() {
      return {
        'x': this.camera_.position.x,
        'y': this.camera_.position.y,
        'z': this.camera_.position.z
      };
    },
    set: function() { log_.error_('position is read-only'); },
    writeable: false
  });
  Object.defineProperty(this, 'zNear', {
    get: function() { return this.zNear_; },
    set: function() { log_.error_('zNear is read-only'); },
    writeable: false
  });
  Object.defineProperty(this, 'zFar', {
    get: function() { return this.zFar_; },
    set: function() { log_.error_('zFar is read-only'); },
    writeable: false
  });
}


/**
 * Inherit from Camera.
 */
ThreeJsCamera_.prototype = new Camera();


/**
 * Set the constructor back.
 */
ThreeJsCamera_.prototype.constructor = ThreeJsCamera_.constructor;


/**
 * The camera's field of view along the y axis.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['fovY'] = null;

// XYZ object for the camera's position.
ThreeJsCamera_.prototype['position'] = {};


/**
 * The camera position's x coordinate.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['position']['x'] = {};


/**
 * The camera position's y coordinate.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['position']['y'] = {};


/**
 * The camera position's z coordinate.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['position']['z'] = {};


/**
 * The camera's near Z distance.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['zNear'] = null;


/**
 * The camera's far Z distance.
 *
 * @type {number}
 */
ThreeJsCamera_.prototype['zFar'] = null;


/**
 * Initializes the camera.
 *
 * @private
 */
ThreeJsCamera_.prototype.init_ = function() {
  // The camera is oriented so that 0,0 is the upper-left corner
  this.camera_.up.x = 0;
  this.camera_.up.y = -1;
  this.camera_.up.z = 0;

  this.onResize_();
  this.update_();

  // Register the renderer's onScroll and onResize events with the window
  var self = this;

  window.addEventListener('scroll', function() {
    self.onScroll_();
  }, false);

  window.addEventListener('resize', function() {
    self.onResize_();
  }, false);

  this.pendingCameraMoveEvent_ = true;
};


/**
 * Updates the camera's position when the page is scrolled.
 *
 * @private
 */
ThreeJsCamera_.prototype.onScroll_ = function() {
  this.pendingScroll_ = true;
};


/**
 * Updates the camera's perspective matrix and position when the browser
 * is resized.
 *
 * @private
 */
ThreeJsCamera_.prototype.onResize_ = function() {
  this.pendingResize_ = true;

  this.onScroll_();
};


/**
 * Updates the Z near and Z far distances.
 *
 * This is called by Engine when the browser window is resized.
 *
 * @private
 *
 * @param {number} zNear The minimum Z distance to render.
 * @param {number} zFar The maximum Z distance to render.
 */
ThreeJsCamera_.prototype.setZNearAndFar_ = function(zNear, zFar) {
  this.zNear_ = zNear;
  this.zFar_ = zFar;

  this.camera_.projectionMatrix.makePerspective(this.fovY_,
      this.aspectRatio_, this.zNear_, this.zFar_);
};


/**
 * Called each frame to update the camera settings if necessary.
 *
 * This is done to reduce work during actual scroll/resize events.
 *
 * @private
 */
ThreeJsCamera_.prototype.update_ = function() {
  if (this.pendingResize_) {
    var canvasWidth = parseInt(this.canvas_.style.width, 10);
    var canvasHeight = parseInt(this.canvas_.style.height, 10);

    this.aspectRatio_ = canvasWidth / canvasHeight;

    var fovYInRadians = Math.tan(this.fovY_ / 360.0 * Math.PI);
    this.zCamera_ = (canvasHeight / 2.0) / fovYInRadians;

    this.camera_.projectionMatrix.makePerspective(this.fovY_,
        this.aspectRatio_, this.zNear_, this.zFar_);

    this.camera_.position.z = this.zCamera_;

    // Because we have our up vector pointing the opposite way, you can imagine
    // we rotated the camera 180deg along the Z axis. Therefore, our x coords
    // are reversed now. This flips them back in place. We also have to reverse
    // the face culling which we do when setting up the renderers in Engine.cs.
    this.camera_.scale.x = -1;

    this.pendingResize_ = false;
    this.pendingCameraMoveEvent_ = true;
  }

  if (this.pendingScroll_) {
    var canvasWidth = parseInt(this.canvas_.style.width, 10);
    var canvasHeight = parseInt(this.canvas_.style.height, 10);

    this.camera_.position.x = canvasWidth / 2 + window.pageXOffset;
    this.camera_.position.y = canvasHeight / 2 + window.pageYOffset;

    this.camera_.lookAt(new THREE.Vector3(this.camera_.position.x,
        this.camera_.position.y, 0));

    this.pendingScroll_ = false;
    this.pendingCameraMoveEvent_ = true;
  }
};


/**
 * Signals to the renderer that a camera move event should be fired. After
 * firing, this flag should be cleared.
 *
 * @private
 * @type {boolean}
 */
ThreeJsCamera_.prototype.pendingCameraMoveEvent_ = false;


/**
 * The actual ThreeJs camera object.
 *
 * @private
 * @type {THREE.Camera}
 */
ThreeJsCamera_.prototype.camera_ = null;
