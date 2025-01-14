import { gsap } from "../gsap_src/index.js";

export class AnimationManager {
  constructor(game) {
    this.game = game;
  }

  async fadeElement(element, newText = null) {
    await gsap.to(element, {
      alpha: 0,
      duration: 0.25,
      ease: "power2.out",
    });

    if (newText !== null) {
      element.text = newText;
    }

    await gsap.to(element, {
      alpha: 1,
      duration: 0.25,
      ease: "power2.in",
    });
  }

  async fadeOutScene(sceneContainer) {
    return new Promise((resolve) => {
      gsap.to(sceneContainer, {
        alpha: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async fadeInScene(sceneContainer) {
    return new Promise((resolve) => {
      gsap.to(sceneContainer, {
        alpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }
}
