// scripts/dice-roller.js
class DiceRoller {
    static roll(type, count = 1, modifier = 0) {
        const matches = type.match(/^d(\d+)$/i);
        if (!matches) return null;
        
        const sides = parseInt(matches[1]);
        let total = 0;
        const rolls = [];
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        total += modifier;
        
        return {
            total,
            rolls,
            modifier,
            type: `${count}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`,
            isCritical: count === 1 && sides === 20 && (rolls[0] === 1 || rolls[0] === 20)
        };
    }
    
    static rollWithAdvantage(modifier = 0) {
        const roll1 = this.roll('d20', 1, modifier);
        const roll2 = this.roll('d20', 1, modifier);
        
        return {
            result: Math.max(roll1.total, roll2.total),
            rolls: [roll1.rolls[0], roll2.rolls[0]],
            type: 'd20 с преимуществом'
        };
    }
    
    static rollWithDisadvantage(modifier = 0) {
        const roll1 = this.roll('d20', 1, modifier);
        const roll2 = this.roll('d20', 1, modifier);
        
        return {
            result: Math.min(roll1.total, roll2.total),
            rolls: [roll1.rolls[0], roll2.rolls[0]],
            type: 'd20 с помехой'
        };
    }
    
    static rollGroupCheck(characters) {
        const worstModifier = Math.min(...characters.map(char => {
            const mod = char.modifiers.dexterity;
            return parseInt(mod) || 0;
        }));
        
        const rollResult = this.roll('d20', 1, worstModifier);
        
        return {
            ...rollResult,
            worstModifier,
            charactersCount: characters.length
        };
    }
}