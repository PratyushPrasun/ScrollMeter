import{a as e,c as t,d as n,l as r,n as i,o as a,r as o,t as s,u as c}from"./statistics-DnJArswa.js";var l=class{constructor(e={}){this.platform=e.platform||`unknown`,this.qualificationSeconds=e.qualificationSeconds??2,this.revisitCooldownSeconds=e.revisitCooldownSeconds??30,this.trackingEnabled=e.trackingEnabled??!0,this.onQualify=e.onQualify||(()=>{}),this.onPlaybackTick=e.onPlaybackTick||(()=>{}),this.onStatusChange=e.onStatusChange||(()=>{}),this.candidate=null,this.qualifiedHistory=new Map,this.lastTickTime=null,this.activeTimeAccumulatorMs=0}setSettings(e={}){e.qualificationSeconds!==void 0&&(this.qualificationSeconds=e.qualificationSeconds),e.revisitCooldownSeconds!==void 0&&(this.revisitCooldownSeconds=e.revisitCooldownSeconds),e.trackingEnabled!==void 0&&(this.trackingEnabled=e.trackingEnabled,!this.trackingEnabled&&this.candidate&&this.cancelCandidate(`tracking_disabled`))}setCandidateVideo(e,t={}){if(!this.trackingEnabled)return;if(!e){this.cancelCandidate(`no_video_id`);return}if(this.candidate&&this.candidate.videoId===e)return;this.candidate&&!this.candidate.hasQualified&&this.cancelCandidate(`swiped_early`);let n=Date.now(),i=this.qualifiedHistory.get(e),a=i&&n-i<this.revisitCooldownSeconds*1e3;this.candidate={videoId:e,platform:this.platform,startedAt:n,status:a?r.QUALIFIED:r.QUALIFYING,hasQualified:!!a,isRevisitSuppressed:!!a,isPlaying:!!t.isPlaying,isVisible:!!t.isVisible,activePlayedMs:0},this.lastTickTime=n,this.onStatusChange(this.getStatus())}updatePlaybackState(e,t){this.candidate&&(this.candidate.isPlaying=!!e,this.candidate.isVisible=!!t,this.onStatusChange(this.getStatus()))}handleVisibilityChange(e){e?this.candidate&&(this.candidate.isVisible=!0,this.candidate.hasQualified||(this.candidate.status=r.QUALIFYING)):(this.candidate&&!this.candidate.hasQualified&&(this.candidate.activePlayedMs=0,this.candidate.status=r.IDLE),this.candidate&&(this.candidate.isVisible=!1)),this.lastTickTime=Date.now(),this.onStatusChange(this.getStatus())}tick(e=Date.now()){if(!this.trackingEnabled||!this.candidate){this.lastTickTime=e;return}let t=this.lastTickTime?Math.max(0,e-this.lastTickTime):0;if(this.lastTickTime=e,this.candidate.isPlaying&&this.candidate.isVisible){if(this.activeTimeAccumulatorMs+=t,this.activeTimeAccumulatorMs>=1e3){let e=Math.floor(this.activeTimeAccumulatorMs/1e3);this.activeTimeAccumulatorMs%=1e3,this.onPlaybackTick(this.platform,e)}if(!this.candidate.hasQualified&&!this.candidate.isRevisitSuppressed){this.candidate.activePlayedMs+=t;let e=this.qualificationSeconds*1e3;this.candidate.activePlayedMs>=e&&this.qualifyCandidate()}}}qualifyCandidate(){if(this.candidate&&!this.candidate.hasQualified){if(this.candidate.hasQualified=!0,this.candidate.status=r.QUALIFIED,this.qualifiedHistory.set(this.candidate.videoId,Date.now()),this.qualifiedHistory.size>200){let e=Array.from(this.qualifiedHistory.keys()).slice(0,50);for(let t of e)this.qualifiedHistory.delete(t)}this.onQualify({platform:this.platform,videoId:this.candidate.videoId,timestamp:Date.now()}),this.onStatusChange(this.getStatus())}}cancelCandidate(e=`unknown`){this.candidate&&(this.candidate.status=r.CANCELLED,this.candidate=null,this.lastTickTime=null,this.activeTimeAccumulatorMs=0,this.onStatusChange(this.getStatus()))}getStatus(){return{trackingEnabled:this.trackingEnabled,platform:this.platform,hasCandidate:!!this.candidate,candidateVideoId:this.candidate?.videoId||null,status:this.candidate?.status||r.IDLE,isPlaying:!!this.candidate?.isPlaying,isVisible:!!this.candidate?.isVisible,activePlayedMs:this.candidate?.activePlayedMs||0,hasQualified:!!this.candidate?.hasQualified}}},u=class{constructor(e={}){this.platform=e.platform||t.YOUTUBE,this.onToggleTracking=e.onToggleTracking||(()=>{}),this.onVisibilityChange=e.onVisibilityChange||(()=>{}),this.isExpanded=!1,this.isHidden=!1,this.isDragging=!1,this.dragOffset={x:0,y:0},this.stats={instagramCount:0,youtubeCount:0,totalCount:0,instagramPlaybackSeconds:0,youtubePlaybackSeconds:0,totalPlaybackSeconds:0},this.settings={trackingEnabled:!0,dailyGoal:100,qualificationSeconds:2},this.engineStatus={status:`IDLE`,isPlaying:!1,isVisible:!1,activePlayedMs:0},this.hostElement=null,this.shadowRoot=null,this.init()}init(){let e=document.getElementById(`scrollmeter-floating-host`);e&&e.remove(),this.hostElement=document.createElement(`div`),this.hostElement.id=`scrollmeter-floating-host`,this.hostElement.style.all=`initial`,this.hostElement.style.position=`fixed`,this.hostElement.style.zIndex=`2147483647`,this.hostElement.style.pointerEvents=`none`;let t=this.loadSavedPosition();this.currentPosition=t||{top:24,right:24},this.applyPosition(),this.shadowRoot=this.hostElement.attachShadow({mode:`open`}),this.render(),document.documentElement.appendChild(this.hostElement),this.attachEventListeners()}loadSavedPosition(){try{let e=localStorage.getItem(`scrollmeter_widget_pos`);return e?JSON.parse(e):null}catch{return null}}savePosition(e){try{localStorage.setItem(`scrollmeter_widget_pos`,JSON.stringify(e))}catch{}}applyPosition(){this.hostElement&&(this.hostElement.style.top=`${this.currentPosition.top}px`,this.currentPosition.left===void 0?(this.hostElement.style.right=`${this.currentPosition.right||24}px`,this.hostElement.style.left=`auto`):(this.hostElement.style.left=`${this.currentPosition.left}px`,this.hostElement.style.right=`auto`))}formatTime(e=0){let t=Math.floor(e/60),n=e%60;return t<60?`${t}m ${n.toString().padStart(2,`0`)}s`:`${Math.floor(t/60)}h ${t%60}m`}update(e,t,n){e&&(this.stats={...this.stats,...e}),t&&(this.settings={...this.settings,...t},t.floatingWidgetEnabled!==void 0&&(this.hostElement.style.display=t.floatingWidgetEnabled?`block`:`none`)),n&&(this.engineStatus={...this.engineStatus,...n}),this.render()}render(){if(!this.shadowRoot)return;let e=this.platform===t.INSTAGRAM,n=e?`Reels`:`Shorts`,r=e?this.stats.instagramCount||0:this.stats.youtubeCount||0,i=e?this.stats.instagramPlaybackSeconds||0:this.stats.youtubePlaybackSeconds||0,a=(this.stats.instagramCount||0)+(this.stats.youtubeCount||0),o=this.settings.dailyGoal||100,s=Math.min(100,Math.round(a/o*100)),c=this.settings.trackingEnabled,l=this.engineStatus.isPlaying&&this.engineStatus.isVisible,u=`#94a3b8`,d=`Paused`;c?l?(u=`#10b981`,d=`Tracking`):(u=`#f59e0b`,d=`Waiting`):(u=`#ef4444`,d=`Tracking Off`);let f=`
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .widget-container {
        pointer-events: auto;
        position: relative;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        color: #f8fafc;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
        user-select: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        min-width: ${this.isExpanded?`240px`:`auto`};
      }
      .widget-container:hover {
        border-color: rgba(16, 185, 129, 0.4);
      }
      .pill-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        cursor: pointer;
      }
      .drag-handle {
        cursor: grab;
        display: flex;
        align-items: center;
        color: #64748b;
        font-size: 11px;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${u};
        box-shadow: 0 0 8px ${u};
        flex-shrink: 0;
      }
      .dot.pulsing {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
      .count-badge {
        font-weight: 700;
        font-size: 13px;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .platform-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
      }
      .quick-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 6px;
      }
      .btn-icon {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 11px;
        line-height: 1;
        transition: color 0.15s, background 0.15s;
      }
      .btn-icon:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.1);
      }
      .expanded-body {
        padding: 10px 14px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .stat-label {
        color: #94a3b8;
      }
      .stat-val {
        color: #f1f5f9;
        font-weight: 600;
      }
      .progress-bar-bg {
        width: 100%;
        height: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        overflow: hidden;
        margin-top: 2px;
      }
      .progress-bar-fill {
        height: 100%;
        background: ${s>=100?`#ef4444`:`#10b981`};
        width: ${s}%;
        transition: width 0.3s ease;
      }
      .btn-toggle {
        margin-top: 4px;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid ${c?`rgba(239, 68, 68, 0.3)`:`rgba(16, 185, 129, 0.3)`};
        background: ${c?`rgba(239, 68, 68, 0.15)`:`rgba(16, 185, 129, 0.15)`};
        color: ${c?`#fca5a5`:`#6ee7b7`};
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
      }
      .btn-toggle:hover {
        background: ${c?`rgba(239, 68, 68, 0.25)`:`rgba(16, 185, 129, 0.25)`};
      }
      .hidden-trigger {
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #10b981;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      }
    `;this.isHidden?this.shadowRoot.innerHTML=`
        <style>${f}</style>
        <div class="hidden-trigger" id="unhide-btn" title="Click to show ScrollMeter counter">
          ● SM: ${r}
        </div>
      `:this.shadowRoot.innerHTML=`
      <style>${f}</style>
      <div class="widget-container" id="widget-card">
        <div class="pill-header" id="pill-header">
          <div class="drag-handle" id="drag-handle" title="Drag to reposition">⋮⋮</div>
          <div class="dot ${l&&c?`pulsing`:``}" title="${d}"></div>
          <div class="count-badge">${n}: ${r}</div>
          <div class="quick-actions">
            <button class="btn-icon" id="toggle-expand-btn" title="${this.isExpanded?`Collapse`:`Expand`}">
              ${this.isExpanded?`▲`:`▼`}
            </button>
            <button class="btn-icon" id="hide-btn" title="Hide floating counter">✕</button>
          </div>
        </div>

        ${this.isExpanded?`
          <div class="expanded-body">
            <div class="stat-row">
              <span class="stat-label">Daily Target:</span>
              <span class="stat-val">${a} / ${o} (${s}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill"></div>
            </div>

            <div class="stat-row">
              <span class="stat-label">Feed Watch Time:</span>
              <span class="stat-val">${this.formatTime(i)}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">Status:</span>
              <span class="stat-val" style="color: ${u};">${d}</span>
            </div>

            <button class="btn-toggle" id="pause-resume-btn">
              ${c?`⏸ Pause Tracking`:`▶ Resume Tracking`}
            </button>
          </div>
        `:``}
      </div>
    `}attachEventListeners(){this.shadowRoot.addEventListener(`click`,e=>{let t=e.target;t.id===`unhide-btn`?(this.isHidden=!1,this.render()):t.id===`toggle-expand-btn`?(this.isExpanded=!this.isExpanded,this.render()):t.id===`hide-btn`?(this.isHidden=!0,this.render()):t.id===`pause-resume-btn`&&this.onToggleTracking()}),this.shadowRoot.addEventListener(`mousedown`,e=>{if(!e.target.closest(`#drag-handle`))return;this.isDragging=!0;let t=this.hostElement.getBoundingClientRect();this.dragOffset={x:e.clientX-t.left,y:e.clientY-t.top};let n=e=>{if(!this.isDragging)return;let t=Math.max(10,Math.min(window.innerWidth-120,e.clientX-this.dragOffset.x)),n=Math.max(10,Math.min(window.innerHeight-50,e.clientY-this.dragOffset.y));this.currentPosition={left:t,top:n},this.applyPosition()},r=()=>{this.isDragging&&(this.isDragging=!1,this.savePosition(this.currentPosition),window.removeEventListener(`mousemove`,n),window.removeEventListener(`mouseup`,r))};window.addEventListener(`mousemove`,n),window.addEventListener(`mouseup`,r)})}destroy(){this.hostElement&&this.hostElement.parentNode&&this.hostElement.remove()}},d=class{constructor(e){this.platform=e,this.engine=null,this.floatingCounter=null,this.tickIntervalId=null,this.stats=null,this.settings=null}async init(){this.settings=await e(),this.stats=await s(),this.engine=new l({platform:this.platform,qualificationSeconds:this.settings.qualificationSeconds,revisitCooldownSeconds:this.settings.revisitCooldownSeconds,trackingEnabled:this.settings.trackingEnabled&&(this.platform===`instagram`?this.settings.countInstagram:this.settings.countYouTube),onQualify:e=>this.handleQualifiedVideo(e),onPlaybackTick:(e,t)=>this.handlePlaybackTick(e,t),onStatusChange:e=>this.handleStatusChange(e)}),this.settings.floatingWidgetEnabled&&(this.floatingCounter=new u({platform:this.platform,onToggleTracking:()=>this.toggleTracking()}),this.floatingCounter.update(this.stats,this.settings,this.engine.getStatus())),this.tickIntervalId=setInterval(()=>{this.engine&&this.engine.tick(Date.now())},200),document.addEventListener(`visibilitychange`,()=>{let e=document.visibilityState===`visible`;this.engine&&this.engine.handleVisibilityChange(e)}),typeof chrome<`u`&&chrome.runtime?.onMessage&&chrome.runtime.onMessage.addListener(e=>{if(e){if(e.type===c.STATS_UPDATED&&e.payload)this.stats=e.payload,this.floatingCounter?.update(this.stats,this.settings,this.engine?.getStatus());else if(e.type===c.SETTINGS_CHANGED&&e.payload){this.settings=e.payload;let t=this.platform===`instagram`?this.settings.countInstagram:this.settings.countYouTube;this.engine?.setSettings({...this.settings,trackingEnabled:this.settings.trackingEnabled&&t}),this.floatingCounter?.update(this.stats,this.settings,this.engine?.getStatus())}}}),typeof chrome<`u`&&chrome.storage?.onChanged&&chrome.storage.onChanged.addListener((e,t)=>{if(t===`local`){if(e.scrollmeter_settings?.newValue){this.settings=e.scrollmeter_settings.newValue;let t=this.platform===`instagram`?this.settings.countInstagram:this.settings.countYouTube;this.engine?.setSettings({...this.settings,trackingEnabled:this.settings.trackingEnabled&&t}),this.floatingCounter?.update(this.stats,this.settings,this.engine?.getStatus())}e.scrollmeter_daily_records?.newValue&&s().then(e=>{this.stats=e,this.floatingCounter?.update(this.stats,this.settings,this.engine?.getStatus())})}})}async handleQualifiedVideo(e){try{await n({type:c.RECORD_QUALIFIED_ENCOUNTER,payload:{platform:this.platform,videoId:e.videoId}}),this.stats=await i(this.platform,e.videoId),this.floatingCounter?.update(this.stats,this.settings,this.engine.getStatus())}catch(e){console.warn(`[ScrollMeter] Error recording qualified encounter:`,e)}}async handlePlaybackTick(e,t){try{await n({type:c.RECORD_PLAYBACK_TICK,payload:{platform:e,seconds:t}}),this.stats=await o(e,t),this.floatingCounter?.update(this.stats,this.settings,this.engine.getStatus())}catch{}}handleStatusChange(e){this.floatingCounter?.update(this.stats,this.settings,e)}async toggleTracking(){let e=!this.settings.trackingEnabled;this.settings=await a({trackingEnabled:e});let t=this.platform===`instagram`?this.settings.countInstagram:this.settings.countYouTube;this.engine?.setSettings({...this.settings,trackingEnabled:e&&t}),n({type:c.UPDATE_SETTINGS,payload:{trackingEnabled:e}}),this.floatingCounter?.update(this.stats,this.settings,this.engine.getStatus())}reportActiveVideo(e,t={}){this.engine&&this.engine.setCandidateVideo(e,t)}updatePlaybackState(e,t){this.engine&&this.engine.updatePlaybackState(e,t)}destroy(){this.tickIntervalId&&clearInterval(this.tickIntervalId),this.floatingCounter?.destroy()}};export{d as t};