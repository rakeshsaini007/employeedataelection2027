export const BLO_REMARK_OPTION = 'बी०एल०ओ०';

export interface BloRemarkInfo {
  isBlo: boolean;
  assemblyNo: string;
  boothNo: string;
}

export function parseBloRemark(remarks: string): BloRemarkInfo {
  const trimmed = (remarks || '').trim();
  if (trimmed === BLO_REMARK_OPTION) {
    return { isBlo: true, assemblyNo: '', boothNo: '' };
  }

  const match = trimmed.match(
    /^बी०एल०ओ०\s*\(विधान सभा: ([^,)]*), बूथ: ([^)]*)\)$/
  );
  if (match) {
    return {
      isBlo: true,
      assemblyNo: match[1],
      boothNo: match[2].trim(),
    };
  }

  return { isBlo: false, assemblyNo: '', boothNo: '' };
}

export function formatBloRemark(assemblyNo: string, boothNo: string): string {
  const cleanBooth = boothNo.trim();
  if (!assemblyNo.trim() && !cleanBooth) {
    return BLO_REMARK_OPTION;
  }
  return `${BLO_REMARK_OPTION} (विधान सभा: ${assemblyNo}, बूथ: ${cleanBooth})`;
}
