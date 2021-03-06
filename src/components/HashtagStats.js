import React from 'react';
import R from 'ramda';
import moment from 'moment';
import {Link, IndexLink} from 'react-router';
import HashtagCard from './HashtagCard.js';
import ComparisonBar from './ComparisonBar.js';

export default React.createClass({
  getInitialState: function () {
    return {
      hashtags: {},
      url: ''
    };
  },
  createTotals: function (props) {
    var rows = props.rows;
    var colors = props.colors;
    var hashtags = {};

    Object.keys(rows).forEach(function (hashtag) {
      var totals = R.reduce(R.mergeWithKey(function (key, l, r) {
        if (key === 'edits' || key === 'buildings' || key === 'roads') {
          return l + r;
        } else if (key === 'created_at') {
          return ((moment(l).unix() > moment(r).unix()) ? l : r);
        } else {
          return l;
        }
      }), {}, rows[hashtag]);

      hashtags[hashtag] = {
        color: colors[hashtag],
        roads: Number(totals.roads.toFixed(2)),
        buildings: totals.buildings,
        edits: totals.edits,
        last_update: totals.created_at
      };
    });

    this.setState({
      hashtags: hashtags,
      url: Object.keys(rows).join(',')
    });
  },
  componentDidMount: function () {
    var props = this.props;
    if (props && props.hasOwnProperty('colors') && props.hasOwnProperty('rows') &&
        Object.keys(props.rows).length > 0) {
      this.createTotals(props);
    }
    if (props && props.hasOwnProperty('lastRefresh')) {
      this.setState({
        lastRefresh: props.lastRefresh
      });
    }
  },
  componentWillReceiveProps: function (props) {
    if (props && props.hasOwnProperty('colors') && props.hasOwnProperty('rows')) this.createTotals(props);
    if (props && props.hasOwnProperty('lastRefresh')) {
      this.setState({
        lastRefresh: props.lastRefresh
      });
    }
  },
  deleteHashtag: function (input) {
    var params = this.props.id;
    var hashtags = R.without([input], params.split(','));
    var mapLocation = R.match(/\/.+\/map/, this.props.location.pathname).length;
    if (mapLocation > 0) {
      this.props.history.push('/' + hashtags.join(',') + '/map');
    } else {
      this.props.history.push('/' + hashtags.join(','));
    }
  },
  render: function () {
    var component = this;
    var cards = R.sortBy(function (key) {
      return component.state.hashtags[key].edits;
    }, Object.keys(component.state.hashtags))
    .reverse()
    .map(function (key, index) {
      var totals = component.state.hashtags[key];
      var isWinner = false;
      var color = 'competitor1';
      switch (totals.color) {
        case 'blueteam':
          color = 'competitor1';
          break;
        case 'redteam':
          color = 'competitor2';
          break;
        case 'greenteam':
          color = 'competitor3';
          break;
        default:
          color = 'competitor1';
      }
      if (index === 0) {
        isWinner = true;
      }
      return <HashtagCard
                isWinner={isWinner}
                color={color}
                totals={totals}
                hashtag={key}
                key={key}
                deleteHashtag={component.deleteHashtag} />;
    });

    var sorted = R.sortBy(R.nth(1),
                          R.toPairs(R.map(R.prop('edits'), component.state.hashtags)));
    var hashtags = R.map(R.nth(0), sorted.reverse());
    var totals = R.map(R.prop('edits'), R.values(component.state.hashtags));
    var max = R.reduce(R.max, 0, totals);
    var list = (hashtags.length > 1)
      ? (
        <div className="Comparison-Block">
          <div className = "section-headline">
            Project Comparison by total edits
          </div>
          {
            hashtags.map(function (hashtag) {
              return <ComparisonBar
                hashtag={hashtag}
                key={hashtag}
                totals={component.state.hashtags[hashtag]} max={max}/>;
            })
          }
        </div>
      )
      : '';

    return (
      <section className="section-secondary">
        <div className="row">
          <div className="action-header">
            <span className="action-header-text sub-text text-right">Refreshed: {moment(component.state.lastRefresh).calendar()}</span>
            <div className="refresh-page"></div>
          </div>
          <div className="competitor-cards-block">
            <span className="section-headline">Current Leader</span>
            <ul className="competitor-cards">
              {cards}
            </ul>
          </div>
          {list}
          <ul className="tabbed-nav">
              <IndexLink to={`/${this.state.url}`} className="tab-style section-headline" activeClassName="active-tab" >Leaderboard</IndexLink>
              <Link to={`/${this.state.url}/map`} className="tab-style section-headline" activeClassName="active-tab">Map View</Link>
          </ul>
        </div>
      </section>
    );
  }
});
