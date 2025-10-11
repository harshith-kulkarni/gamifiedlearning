'use client';

import { useGamification } from '@/contexts/gamification-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Lightbulb, Target, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PowerUpActivator() {
  const { powerUps, activatePowerUp, buyPowerUp, points } = useGamification();
  const { toast } = useToast();

  const handleBuyPowerUp = (powerUpId: string, powerUpName: string) => {
    const success = buyPowerUp(powerUpId);
    if (success) {
      toast({
        title: "Power-up Purchased! ✨",
        description: `${powerUpName} activated! (-100 points)`,
      });
    } else {
      toast({
        title: "Insufficient Points 💸",
        description: "You need 100 points to purchase this power-up.",
        variant: "destructive",
      });
    }
  };

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
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleBuyPowerUp(powerUp.id, powerUp.name)}
                      disabled={powerUp.active || points < 100}
                      className={powerUp.active ? 'opacity-50' : ''}
                    >
                      {powerUp.active ? 'Active' : (
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          <span>Buy (100)</span>
                        </div>
                      )}
                    </Button>
                    {points < 100 && !powerUp.active && (
                      <span className="text-xs text-red-500">Need {100 - points} more points</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span>Power-ups cost 100 points each</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">{points} points</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}