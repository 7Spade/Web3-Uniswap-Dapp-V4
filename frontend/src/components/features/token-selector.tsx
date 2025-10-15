"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { tokens, type Token } from "../../lib/tokens";
import { Button } from '../ui/button';

interface TokenSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectToken: (token: Token) => void;
  selectedToken?: Token;
}

export function TokenSelector({ open, onOpenChange, onSelectToken, selectedToken }: TokenSelectorProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if(open) {
      setSearch('');
    }
  }, [open]);

  const filteredTokens = useMemo(() =>
    tokens.filter(token =>
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.symbol.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or paste address"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          <div className="flex flex-col gap-1 p-2">
            {filteredTokens.map(token => {
              const Icon = token.icon;
              const isSelected = selectedToken?.address === token.address;
              return (
                <Button
                  variant="ghost"
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  disabled={isSelected}
                  className="flex items-center gap-3 p-2 h-auto justify-start disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-8 w-8" />
                  <div className="text-left">
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
