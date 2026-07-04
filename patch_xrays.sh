#!/bin/bash
sed -i "s/type: 'OPG' | 'RVG' | 'CBCT' | 'Other';/type: 'OPG' | 'RVG' | 'CBCT' | 'Other';\n  stage?: 'Oldin' | 'Keyin' | 'Jarayon' | 'Boshqa';/" src/components/XRayCenter.tsx

sed -i "s/const \[uploadType, setUploadType\] = useState<XRay\['type'\]>('OPG');/const \[uploadType, setUploadType\] = useState<XRay\['type'\]>('OPG');\n  const \[uploadStage, setUploadStage\] = useState<XRay\['stage'\]>('Oldin');/" src/components/XRayCenter.tsx

sed -i "s/type: uploadType,/type: uploadType,\n      stage: uploadStage,/" src/components/XRayCenter.tsx

