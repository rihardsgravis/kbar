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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeepMatches = exports.useMatches = exports.NO_GROUP = void 0;
var match_sorter_1 = require("match-sorter");
var React = __importStar(require("react"));
var useKBar_1 = require("./useKBar");
var utils_1 = require("./utils");
exports.NO_GROUP = "none";
/**
 * returns deep matches only when a search query is present
 */
function useMatches() {
    var _a = (0, useKBar_1.useKBar)(function (state) { return ({
        search: state.searchQuery,
        actions: state.actions,
        rootActionId: state.currentRootActionId,
    }); }), search = _a.search, actions = _a.actions, rootActionId = _a.rootActionId;
    var rootResults = React.useMemo(function () {
        return Object.keys(actions).reduce(function (acc, actionId) {
            var action = actions[actionId];
            if (!action.parent && !rootActionId) {
                acc.push(action);
            }
            if (action.id === rootActionId) {
                for (var i = 0; i < action.children.length; i++) {
                    acc.push(action.children[i]);
                }
            }
            return acc;
        }, []);
    }, [actions, rootActionId]);
    var getDeepResults = React.useCallback(function (actions) {
        return (function collectChildren(actions, all) {
            if (all === void 0) { all = __spreadArray([], actions, true); }
            for (var i = 0; i < actions.length; i++) {
                if (actions[i].children.length > 0) {
                    all.push.apply(all, actions[i].children);
                    collectChildren(actions[i].children, all);
                }
            }
            return all;
        })(actions);
    }, []);
    var emptySearch = !search;
    var filtered = React.useMemo(function () {
        if (emptySearch)
            return rootResults;
        return getDeepResults(rootResults);
    }, [getDeepResults, rootResults, emptySearch]);
    var matches = useInternalMatches(filtered, search);
    var results = React.useMemo(function () {
        var groupMap = {};
        for (var i = 0; i < matches.length; i++) {
            var action = matches[i];
            var section = action.section || exports.NO_GROUP;
            if (!groupMap[section]) {
                groupMap[section] = [];
            }
            groupMap[section].push(action);
        }
        var results = [];
        Object.keys(groupMap).forEach(function (name) {
            if (name !== exports.NO_GROUP)
                results.push(name);
            var actions = groupMap[name];
            for (var i = 0; i < actions.length; i++) {
                results.push(actions[i]);
            }
        });
        return results;
    }, [matches]);
    // ensure that users have an accurate `currentRootActionId`
    // that syncs with the throttled return value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    var memoRootActionId = React.useMemo(function () { return rootActionId; }, [results]);
    return React.useMemo(function () { return ({
        results: results,
        rootActionId: memoRootActionId,
    }); }, [memoRootActionId, results]);
}
exports.useMatches = useMatches;
function useInternalMatches(filtered, search) {
    var value = React.useMemo(function () { return ({
        filtered: filtered,
        search: search,
    }); }, [filtered, search]);
    var _a = (0, utils_1.useThrottledValue)(value), throttledFiltered = _a.filtered, throttledSearch = _a.search;
    return React.useMemo(function () {
        return throttledSearch.trim() === ""
            ? throttledFiltered
            : (0, match_sorter_1.matchSorter)(throttledFiltered, throttledSearch, {
                keys: ["name", "keywords", "subtitle"],
            });
    }, [throttledFiltered, throttledSearch]);
}
/**
 * @deprecated use useMatches
 */
exports.useDeepMatches = useMatches;
