/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';

const DEFAULT_MAX_WIDTH = '260px';
const ANCHOR_DELIMITER = '-';

// The used mapboxgl.Popup component removes and re-creates the tooltip HTML element on update.
// This adds a wrapper around that in order that the tooltip content will be handled and updated by React.
export class DrawPopup extends Component {
  _mbPopup = null;

  static defaultProps = {
    location: [],
    options: {
      closeButton: false,
      closeOnClick: false,
      maxWidth: DEFAULT_MAX_WIDTH,
    },
  };

  constructor(props) {
    super(props);

    this._mbPopup = new mapboxgl.Popup(props.options);

    // Must assign the following classes to keep the current style of tooltip
    this.portalNode = document.createElement('div');
    this.portalNode.setAttribute('class', 'mapContainer mapboxgl-map');
    this.portalNode.setAttribute('style', 'overflow: visible');
    document.body.appendChild(this.portalNode);

    this.containerRef = element => (this._mbPopup._container = element);
    this.contentRef = element => (this._mbPopup._content = element);
    this.tipRef = element => (this._mbPopup._tip = element);

    this._update = this._update.bind(this);
    this._removeMap = this._removeMap.bind(this);
  }

  _calculateAnchorPosition() {
    const pos = this._mbPopup._pos;
    const width = this._mbPopup._container.offsetWidth;
    const height = this._mbPopup._container.offsetHeight;

    const bounds = this.props.map._container.getBoundingClientRect();
    const { clientHeight, clientWidth } = document.documentElement;

    const anchorComponents = [];
    // Check that the tooltip does not reach the page boundries
    if (bounds.y + pos.y + height > clientHeight && bounds.y + pos.y - height > 0) {
      anchorComponents.push('bottom');
    } else if (bounds.y + pos.y + height < clientHeight && bounds.y + pos.y - height < 0) {
      anchorComponents.push('top');
    }
    if (bounds.x + pos.x + width > clientWidth && bounds.x + pos.x - width > 0) {
      anchorComponents.push('right');
    } else if (bounds.x + pos.x + width < clientWidth && bounds.x + pos.x - width < 0) {
      anchorComponents.push('left');
    }

    return anchorComponents.join(ANCHOR_DELIMITER);
  }

  _calculateOffset() {
    const bounds = this.props.map._container.getBoundingClientRect();
    return [bounds.x + window.scrollX, bounds.y + window.scrollY];
  }

  _isLocationChanged() {
    const { lng: curLng, lat: curLat } = this._mbPopup.getLngLat() || {};
    const [newLng, newLat] = this.props.location || [];
    return curLng !== newLng || curLat !== newLat;
  }

  _setMap(map) {
    if (map === this._mbPopup._map) {
      return;
    }

    this._removeMap();

    this._mbPopup._map = map;
    this._mbPopup._map.on('move', this._update);
    this._mbPopup._map.on('remove', this._removeMap);
  }

  _removeMap() {
    if (this._mbPopup._map) {
      this._mbPopup._map.off('move', this._update);
      this._mbPopup._map.off('remove', this._removeMap);
      this._mbPopup._map = null;
    }
  }

  _update() {
    requestAnimationFrame(() => {
      let updated = false;
      const { options = {}, location = [0, 0], map } = this.props;

      if (!map || !this._mbPopup || !this._mbPopup._container || !this._mbPopup._content) {
        return;
      }

      this._mbPopup.options = {
        ...this._mbPopup.options,
        offset: this._calculateOffset(),
        anchor: null,
        ...options,
      };

      this._setMap(map);

      if (this._isLocationChanged()) {
        this._mbPopup.setLngLat(location);
        updated = true;
      }

      // To ensure this._mbPopup.pos is updated according to the current map positions/zoom level
      // before recalculating the anchor position
      if (!updated) {
        this._mbPopup._update();
      }

      this._mbPopup.options.anchor = this._calculateAnchorPosition();
      this._mbPopup._update();
    });
  }

  _remove() {
    // The removal of the HTML elmenents are handled by React.
    // Nullify the containers otherwise mapboxgl.Popup removes them.
    if (this._mbPopup) {
      this._mbPopup._container = null;
      this._mbPopup._content = null;
      this._removeMap();
    }

    if (this.portalNode && this.portalNode.parentNode) {
      this.portalNode.parentNode.removeChild(this.portalNode);
      this.portalNode = null;
    }
  }

  componentDidMount() {
    this._update();
  }

  componentDidUpdate() {
    this._update();
  }

  componentWillUnmount = () => {
    this._remove();
  };

  render() {
    const { tip, children } = this.props;

    return (
      this.portalNode &&
      ReactDOM.createPortal(
        <div className="mapboxgl-popup" ref={this.containerRef}>
          <div className="mapboxgl-popup-tip" ref={this._mbPopup._tip}>
            {tip}
          </div>
          <div className="mapboxgl-popup-content" ref={this.contentRef}>
            {children({ updatePosition: this._update.bind(this) })}
          </div>
        </div>,
        this.portalNode
      )
    );
  }
}

DrawPopup.propTypes = {
  map: PropTypes.object.isRequired,
  tip: PropTypes.node,
  location: PropTypes.oneOfType([
    PropTypes.shape({
      lon: PropTypes.number,
      lat: PropTypes.number,
    }),
    PropTypes.arrayOf(PropTypes.number),
  ]),
  options: PropTypes.shape({
    closeButton: PropTypes.bool,
    closeOnClick: PropTypes.bool,
    maxWidth: PropTypes.string,
  }),
  children: PropTypes.func,
};
