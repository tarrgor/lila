import { h } from 'snabbdom'
import { VNode } from 'snabbdom/vnode';
import { spinner, bind, numberRow, playerName, dataIcon, player as renderPlayer } from './util';
import { status } from 'game';
import TournamentController from '../ctrl';

function result(win, stat): string {
  switch (win) {
    case true:
      return '1';
    case false:
      return '0';
    default:
      return stat >= status.ids.mate ? '½' : '*';
  }
}

function playerTitle(player) {
  return h('h2', [
    h('span.rank', player.rank + '. '),
    renderPlayer(player, true, false, false)
  ]);
}

function setup(vnode: VNode) {
  const el = vnode.elm as HTMLElement, p = window.lichess.powertip;
  p.manualUserIn(el);
  p.manualGameIn(el);
}

export default function(ctrl: TournamentController): VNode {
  const data = ctrl.playerInfo.data;
  var noarg = ctrl.trans.noarg;
  if (!data || data.player.id !== ctrl.playerInfo.id) return h('div.player.box', [
    h('div.stats', [
      playerTitle(ctrl.playerInfo.player),
      spinner()
    ])
  ]);
  const nb = data.player.nb,
  pairingsLen = data.pairings.length,
  avgOp = pairingsLen ? Math.round(data.pairings.reduce(function(a, b) {
    return a + b.op.rating;
  }, 0) / pairingsLen) : undefined;
  return h('div.player.box', {
    hook: {
      insert: setup,
      postpatch(_, vnode) { setup(vnode) }
    }
  }, [
    h('close', {
      attrs: dataIcon('L'),
      hook: bind('click', () => ctrl.showPlayerInfo(data.player), ctrl.redraw)
    }),
    h('div.stats', [
      playerTitle(data.player),
      h('table', [
        data.player.performance ? numberRow(
          noarg('performance'),
          data.player.performance + (nb.game < 3 ? '?' : ''),
          'raw') : null,
          numberRow(noarg('gamesPlayed'), nb.game),
          ...(nb.game ? [
            numberRow(noarg('winRate'), [nb.win, nb.game], 'percent'),
            numberRow(noarg('berserkRate'), [nb.berserk, nb.game], 'percent'),
            numberRow(noarg('averageOpponent'), avgOp, 'raw')
          ] : [])
      ])
    ]),
    h('div.scroll-shadow-soft', [
      h('table.pairings', {
        hook: bind('click', e => {
          const href = ((e.target as HTMLElement).parentNode as HTMLElement).getAttribute('data-href');
          if (href) window.open(href, '_blank');
        })
      }, data.pairings.map(function(p, i) {
        const res = result(p.win, p.status);
        return h('tr.glpt.' + (res === '1' ? ' win' : (res === '0' ? ' loss' : '')), {
          key: p.id,
          attrs: { 'data-href': '/' + p.id + '/' + p.color },
          hook: {
            destroy: vnode => $.powerTip.destroy(vnode.elm as HTMLElement)
          }
        }, [
          h('th', '' + (Math.max(nb.game, pairingsLen) - i)),
          h('td', playerName(p.op)),
          h('td', p.op.rating),
          h('td.is.color-icon.' + p.color),
          h('td', res)
        ]);
      }))
    ])
  ]);
};
