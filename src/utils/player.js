import { Howl, Howler } from 'howler'
import { SDK } from '@/sdk'

let PLAYER_LOCK = false
const Player = function () {
  this.key = +new Date()
}
Player.prototype = {
  get locked () {
    return PLAYER_LOCK
  },
  init (playlist, options) {
    if (!PLAYER_LOCK) {
      this.playlist = playlist
      this.index = 0
      this.timer = null
      this.playing = false
      const { timeout, interval, endInterval } = options
      this.interval = interval || 0
      this.endInterval = endInterval || 0
      this.timeout = timeout || 0
      this.options = options
    }
    return this
  },
  start: function () {
    if (!PLAYER_LOCK) {
      PLAYER_LOCK = true
      this.playing = true
      // 设置超时时间，避免播放打断
      if (this.timeout > 0) {
        this.timer = setTimeout(() => {
          this.playing = false
          PLAYER_LOCK = false
          this.destory()
          typeof this.options.ontimeout === 'function' && this.options.ontimeout(this)
        }, this.timeout)
      }
      typeof this.options.onstart === 'function' && this.options.onstart(this)
      this.play(0)
    } else {
      console.warn('存在正在进行的播放器')
    }
  },
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index) {
    var self = this
    var sound

    index = typeof index === 'number' ? index : self.index
    var data = self.playlist[index]

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl
    } else {
      sound = data.howl = new Howl({
        // autoplay: true,
        src: [data.file],
        // html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {

        },
        onload: function () {
          // console.log('onload', self.index)
        },
        onend: async function () {
          if (self.index + 1 < self.playlist.length) {
            // sound._html5 === false && await self.wait(self.interval)
            await self.wait(self.interval)
            self.skip('next')
          } else {
            clearTimeout(self.timer)
            await self.wait(self.endInterval)
            self.playing = false
            PLAYER_LOCK = false
            if (typeof self.options.onsuccess === 'function') {
              self.options.onsuccess(self)
            }
          }
          // console.log('onend', self.index, e)
        },
        onpause: function () {
          // console.log('onpause', self.index)
        },
        onstop: function (e) {
          // console.log('onstop', self.index, e)
        },
        onseek: function () {

        },
        onplayerror: function (e) {
          console.log('onplayerror', self.index, e)
        }
      })
    }
    // Begin playing the sound.
    if (self.playing) {
      sound.play()
    }
    // Keep track of the index we are currently playing.
    self.index = index
  },
  destory: function () {
    clearTimeout(this.timer)
    this.playlist.forEach(item => {
      if (item.howl !== null) {
        item.howl.unload()
        item.howl = null
      }
    })
    this.playing = false
    PLAYER_LOCK = false
  },
  /**
   * Pause the currently playing track.
   */
  pause: function () {
    var self = this

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl

    // Puase the sound.
    sound?.pause()
    PLAYER_LOCK = false
    clearTimeout(self.timer)
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function (direction) {
    var self = this

    // Get the next track based on the direction of the track.
    var index = 0
    if (direction === 'prev') {
      index = self.index - 1
      if (index < 0) {
        index = self.playlist.length - 1
      }
    } else {
      index = self.index + 1
      if (index >= self.playlist.length) {
        index = 0
      }
      self.skipTo(index)
    }
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function (index) {
    var self = this

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop()
    }

    // Play the new track.
    self.play(index)
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function (val) {
    // Update the global volume (affecting all Howls).
    Howler.volume(val)
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function (per) {
    var self = this

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per)
    }
  },
  wait: function (delay) {
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    })
  }
}

const player = new Player()
player.isSupportWebAudio = Howler.usingWebAudio
export default player