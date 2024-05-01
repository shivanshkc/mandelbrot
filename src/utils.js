const utils = {
  /**
   * fetchText fetches all data from the given path as text.
   * @param {string} path
   * @returns {Promise<string>}
   */
  fetchText: async function (path) {
    return (await fetch(path)).text();
  },
  // state variables for the FPS calculator.
  _lastTimestamp: 0.0,
  _frameCountYet: 0.0,
  _lastAverageFPMS: 0.0,
  /**
   * showFPS calculates the FPS as per the given timestamp and puts it in the given UI element.
   * @param {number} timestamp
   * @param {HTMLElement} elem
   */
  showFPS: function (timestamp, elem) {
    const currentFPMS = 1.0 / (timestamp - utils._lastTimestamp);
    if (!isFinite(currentFPMS)) return;

    const latestAverageFPMS =
      (utils._frameCountYet * utils._lastAverageFPMS + currentFPMS) /
      (utils._frameCountYet + 1);

    const averageFPS = Math.ceil(latestAverageFPMS * 1000);
    const actualFPS = Math.ceil(currentFPMS * 1000);
    elem.innerText = `Avg FPS: ${averageFPS} | Actual FPS: ${actualFPS}`;

    utils._lastTimestamp = timestamp;
    utils._lastAverageFPMS = latestAverageFPMS;
    utils._frameCountYet++;
  },
  planeVetices: [
    -1.0, +1.0, 0, -1.0, -1.0, 0, +1.0, -1.0, 0, -1.0, +1.0, 0, +1.0, -1.0, 0,
    +1.0, +1.0, 0,
  ],
  texCoord: [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1],
};
