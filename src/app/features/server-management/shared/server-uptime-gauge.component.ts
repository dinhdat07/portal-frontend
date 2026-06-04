import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-server-uptime-gauge',
  template: `
    <div class="uptime-gauge">
      <svg viewBox="0 0 36 36" class="gauge-svg">
        <path
          class="gauge-bg"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="var(--bg-soft-gray)" stroke-width="3"
        />
        <path
          class="gauge-fill"
          [attr.d]="arcPath()"
          fill="none" [attr.stroke]="arcColor()" stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
      <div class="gauge-value">{{ displayValue() }}%</div>
      <div class="gauge-label">Uptime</div>
    </div>
  `,
  styles: [`
    .uptime-gauge { position: relative; width: 120px; height: 120px; margin: 0 auto; text-align: center; }
    .gauge-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .gauge-fill { transition: stroke-dasharray 0.5s ease; }
    .gauge-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%); font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
    .gauge-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, 20px); font-size: 0.75rem; color: var(--text-secondary); }
  `],
})
export class ServerUptimeGaugeComponent {
  @Input() uptimePercent = 0;

  displayValue(): number {
    return Math.round(this.uptimePercent * 10) / 10;
  }

  arcPath(): string {
    const pct = Math.min(100, Math.max(0, this.uptimePercent));
    const angle = (pct / 100) * 359.99;
    const r = 15.9155;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = 18 + r * Math.cos(radians);
    const y = 18 + r * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    return `M 2.0845 18 A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
  }

  arcColor(): string {
    if (this.uptimePercent >= 99) return 'var(--success)';
    if (this.uptimePercent >= 95) return 'var(--warning)';
    return 'var(--error)';
  }
}
