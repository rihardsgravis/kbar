"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalEvents = void 0;
var React = __importStar(require("react"));
var types_1 = require("./types");
var useKBar_1 = require("./useKBar");
var utils_1 = require("./utils");
function InternalEvents() {
    useToggleHandler();
    useDocumentLock();
    useShortcuts();
    useFocusHandler();
    return null;
}
exports.InternalEvents = InternalEvents;
/**
 * `useToggleHandler` handles the keyboard events for toggling kbar.
 */
function useToggleHandler() {
    var _a, _b;
    var _c = (0, useKBar_1.useKBar)(function (state) { return ({
        visualState: state.visualState,
        showing: state.visualState !== types_1.VisualState.hidden,
    }); }), query = _c.query, options = _c.options, visualState = _c.visualState, showing = _c.showing;
    React.useEffect(function () {
        function handleKeyDown(event) {
            var _a, _b, _c, _d, _e, _f;
            if ((0, utils_1.isModKey)(event) &&
                event.key === "k" &&
                event.defaultPrevented === false) {
                event.preventDefault();
                query.toggle();
                if (showing) {
                    (_b = (_a = options.callbacks) === null || _a === void 0 ? void 0 : _a.onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                else {
                    (_d = (_c = options.callbacks) === null || _c === void 0 ? void 0 : _c.onOpen) === null || _d === void 0 ? void 0 : _d.call(_c);
                }
            }
            if (event.key === "Escape") {
                if (showing) {
                    event.stopPropagation();
                    (_f = (_e = options.callbacks) === null || _e === void 0 ? void 0 : _e.onClose) === null || _f === void 0 ? void 0 : _f.call(_e);
                }
                query.setVisualState(function (vs) {
                    if (vs === types_1.VisualState.hidden || vs === types_1.VisualState.animatingOut) {
                        return vs;
                    }
                    return types_1.VisualState.animatingOut;
                });
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return function () { return window.removeEventListener("keydown", handleKeyDown); };
    }, [options.callbacks, query, showing]);
    var timeoutRef = React.useRef();
    var runAnimateTimer = React.useCallback(function (vs) {
        var _a, _b;
        var ms = 0;
        if (vs === types_1.VisualState.animatingIn) {
            ms = ((_a = options.animations) === null || _a === void 0 ? void 0 : _a.enterMs) || 0;
        }
        if (vs === types_1.VisualState.animatingOut) {
            ms = ((_b = options.animations) === null || _b === void 0 ? void 0 : _b.exitMs) || 0;
        }
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(function () {
            var backToRoot = false;
            // TODO: setVisualState argument should be a function or just a VisualState value.
            query.setVisualState(function () {
                var finalVs = vs === types_1.VisualState.animatingIn
                    ? types_1.VisualState.showing
                    : types_1.VisualState.hidden;
                if (finalVs === types_1.VisualState.hidden) {
                    backToRoot = true;
                }
                return finalVs;
            });
            if (backToRoot) {
                query.setCurrentRootAction(null);
            }
        }, ms);
    }, [(_a = options.animations) === null || _a === void 0 ? void 0 : _a.enterMs, (_b = options.animations) === null || _b === void 0 ? void 0 : _b.exitMs, query]);
    React.useEffect(function () {
        switch (visualState) {
            case types_1.VisualState.animatingIn:
            case types_1.VisualState.animatingOut:
                runAnimateTimer(visualState);
                break;
        }
    }, [runAnimateTimer, visualState]);
}
/**
 * `useDocumentLock` is a simple implementation for preventing the
 * underlying page content from scrolling when kbar is open.
 */
function useDocumentLock() {
    var _a = (0, useKBar_1.useKBar)(function (state) { return ({
        visualState: state.visualState,
    }); }), visualState = _a.visualState, options = _a.options;
    React.useEffect(function () {
        if (options.disableDocumentLock)
            return;
        if (visualState === types_1.VisualState.animatingIn) {
            document.body.style.pointerEvents = "none";
            document.body.style.overflow = "hidden";
            if (!options.disableScrollbarManagement) {
                var scrollbarWidth = (0, utils_1.getScrollbarWidth)();
                // take into account the margins explicitly added by the consumer
                var mr = getComputedStyle(document.body)["margin-right"];
                if (mr) {
                    // remove non-numeric values; px, rem, em, etc.
                    scrollbarWidth += Number(mr.replace(/\D/g, ""));
                }
                document.body.style.marginRight = scrollbarWidth + "px";
            }
        }
        else if (visualState === types_1.VisualState.hidden) {
            document.body.style.removeProperty("pointer-events");
            document.body.style.removeProperty("overflow");
            if (!options.disableScrollbarManagement) {
                document.body.style.removeProperty("margin-right");
            }
        }
    }, [options.disableScrollbarManagement, options.disableDocumentLock, visualState]);
}
/**
 * `useShortcuts` registers and listens to keyboard strokes and
 * performs actions for patterns that match the user defined `shortcut`.
 */
function useShortcuts() {
    var _a = (0, useKBar_1.useKBar)(function (state) { return ({
        actions: state.actions,
    }); }), actions = _a.actions, query = _a.query, options = _a.options;
    React.useEffect(function () {
        var actionsList = Object.keys(actions).map(function (key) { return actions[key]; });
        var buffer = [];
        var lastKeyStrokeTime = Date.now();
        function handleKeyDown(event) {
            var _a, _b, _c, _d, _e, _f, _g;
            var key = (_a = event.key) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if ((0, utils_1.shouldRejectKeystrokes)() || event.metaKey || key === "shift") {
                return;
            }
            var currentTime = Date.now();
            if (currentTime - lastKeyStrokeTime > 400) {
                buffer = [];
            }
            buffer.push(key);
            lastKeyStrokeTime = currentTime;
            var bufferString = buffer.join("");
            for (var _i = 0, actionsList_1 = actionsList; _i < actionsList_1.length; _i++) {
                var action = actionsList_1[_i];
                if (!action.shortcut) {
                    continue;
                }
                if (action.shortcut.join("") === bufferString) {
                    event.preventDefault();
                    if ((_b = action.children) === null || _b === void 0 ? void 0 : _b.length) {
                        query.setCurrentRootAction(action.id);
                        query.toggle();
                        (_d = (_c = options.callbacks) === null || _c === void 0 ? void 0 : _c.onOpen) === null || _d === void 0 ? void 0 : _d.call(_c);
                    }
                    else {
                        (_e = action.command) === null || _e === void 0 ? void 0 : _e.perform();
                        (_g = (_f = options.callbacks) === null || _f === void 0 ? void 0 : _f.onSelectAction) === null || _g === void 0 ? void 0 : _g.call(_f, action);
                    }
                    buffer = [];
                    break;
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return function () { return window.removeEventListener("keydown", handleKeyDown); };
    }, [actions, query]);
}
/**
 * `useFocusHandler` ensures that focus is set back on the element which was
 * in focus prior to kbar being triggered.
 */
function useFocusHandler() {
    var isShowing = (0, useKBar_1.useKBar)(function (state) { return ({
        isShowing: state.visualState === types_1.VisualState.showing ||
            state.visualState === types_1.VisualState.animatingIn,
    }); }).isShowing;
    var activeElementRef = React.useRef(null);
    React.useEffect(function () {
        if (isShowing) {
            activeElementRef.current = document.activeElement;
            return;
        }
        // This fixes an issue on Safari where closing kbar causes the entire
        // page to scroll to the bottom. The reason this was happening was due
        // to the search input still in focus when we removed it from the dom.
        var currentActiveElement = document.activeElement;
        if ((currentActiveElement === null || currentActiveElement === void 0 ? void 0 : currentActiveElement.tagName.toLowerCase()) === "input") {
            currentActiveElement.blur();
        }
        var activeElement = activeElementRef.current;
        if (activeElement) {
            activeElement.focus();
        }
    }, [isShowing]);
}
