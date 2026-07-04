const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const addIcon = (iconName) => {
    if (!code.includes(iconName + ',') && !code.includes(iconName + ' ') && !code.includes(iconName + '\\n')) {
        code = code.replace('} from "lucide-react";', '  ' + iconName + ',\\n} from "lucide-react";');
    }
};

['Users', 'UserCheck', 'Calendar', 'CreditCard', 'DollarSign', 'Filter', 'Eye', 'Edit2', 'FileDown', 'UserPlus', 'MoreHorizontal', 'AlertCircle', 'CalendarClock'].forEach(addIcon);

fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
console.log("Icons updated");
