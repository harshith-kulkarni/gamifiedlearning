'use client';

import { useGamification } from '@/contexts/gamification-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Lightbulb, Target } from 'lucide-react';

export function PowerUpActivator() {
  const { powerUps, activatePowerUp } = useGamification();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Zap className="h-4 w-4 text-yellow-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Power-ups & Boosters</h4>
          <p className="text-sm text-muted-foreground">
            Activate power-ups to enhance your study session
          </p>
          <div className="space-y-3">
            {powerUps.map(powerUp => (
              <div 
                key={powerUp.id} 
                className={`p-3 rounded-lg border ${
                  powerUp.active 
                    ? 'border-yellow-500 bg-yellow-500/10' 
                    : 'border-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{powerUp.icon}</span>
                    <div>
                      <h3 className="font-medium">{powerUp.name}</h3>
                      <p className="text-sm text-muted-foreground">{powerUp.description}</p>
                      {powerUp.active && powerUp.endTime && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Active until {powerUp.endTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => activatePowerUp(powerUp.id)}
                    disabled={powerUp.active}
                    className={powerUp.active ? 'opacity-50' : ''}
                  >
                    {powerUp.active ? 'Active' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Power-ups can boost your learning experience</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}