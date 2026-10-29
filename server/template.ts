import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import type { SpecDataToValidate } from "./validator.js";

export function determineTemplate(creditsLtp: string, courseType: string, override?: "integrated" | "non_lab"): "integrated" | "non_lab" {
  if (override) return override;
  const parts = (creditsLtp || "").split(":").map(Number);
  const practicalCredits = parts[2] ?? 0;
  if (practicalCredits > 0 || (courseType || "").toLowerCase().includes("lab")) {
    return "integrated";
  }
  return "non_lab";
}

export function fillOfficialHtmlTemplate(spec: SpecDataToValidate): string {
  const templateName = spec.template === "integrated" ? "integrated_lab.html" : "non_lab.html";
  const templatePath = path.resolve(process.cwd(), "templates", templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Official template '${templateName}' not found in templates directory.`);
  }

  const rawHtml = fs.readFileSync(templatePath, "utf-8");
  const $ = cheerio.load(rawHtml);

  // 1. Title Block & Basic Course Details Table
  $("h1 span[contenteditable='true']").text(spec.course.title);

  // Top course details table (Title, Code, Type, Department)
  $("table").first().find("tr").each((_, row) => {
    const label = $(row).find("td.static").text().trim().toLowerCase();
    const valCell = $(row).find("td[contenteditable='true']");
    if (label.includes("title")) {
      valCell.text(spec.course.title);
    } else if (label.includes("code")) {
      valCell.text(spec.course.code);
    } else if (label.includes("type")) {
      valCell.text(spec.course.course_type);
    } else if (label.includes("department")) {
      valCell.text(spec.course.department);
    }
  });

  // 2. Section 1: Course Summary
  $("h2:contains('1. Course Summary')").next("p[contenteditable='true']").text(spec.course.summary);

  // 3. Section 2: Course Size and Credits
  const sec2Table = $("h2:contains('2. Course Size and Credits')").nextAll("table").first();
  if (sec2Table.length) {
    sec2Table.find("tr").each((_, row) => {
      const label = $(row).find("td.static").text().trim().toLowerCase();
      const valCell = $(row).find("td[contenteditable='true']");
      if (label.includes("credit structure")) {
        valCell.text(spec.course.credits_ltp);
      } else if (label.includes("total hours")) {
        if (spec.teaching_hours.total) valCell.text(String(spec.teaching_hours.total));
      } else if (label.includes("department responsible")) {
        valCell.text(spec.course.department);
      }
    });
  }

  // 4. Section 3: Course Outcomes (ul.co-list)
  const coList = $("ul.co-list");
  if (coList.length) {
    coList.empty();
    spec.course_outcomes.forEach((co) => {
      coList.append(`<li>${co.statement}</li>\n`);
    });
  }

  // 5. Section 4: Course Contents (unit-row)
  const sec4 = $("h2:contains('4. Course Contents')");
  if (sec4.length) {
    // Remove existing sample unit-rows
    sec4.nextUntil("h2", ".unit-row").remove();
    // Insert actual units
    const unitElements = spec.units
      .map(
        (u) =>
          `<div class="unit-row"><span class="static unit-label" style="padding: 1px 3px; border-radius: 2px;">Unit ${u.number}:</span> <span contenteditable="true">${u.title}${u.lab ? ` (Lab: ${u.lab})` : ""}</span></div>`
      )
      .join("\n");
    sec4.after("\n" + unitElements + "\n");
  }

  // 6. Section 5: CO-PO-PSO Matrix (table.copo-table)
  const matrixTable = $("table.copo-table tbody");
  if (matrixTable.length) {
    matrixTable.empty();
    spec.course_outcomes.forEach((co) => {
      const coMap = spec.co_po_pso_map[co.id] || {};
      let rowHtml = `<tr><td class="text-center" contenteditable="true" style="font-weight:bold;">${co.id}</td>`;

      // PO-1 to PO-11
      for (let i = 1; i <= 11; i++) {
        const key = `PO-${i}`;
        const val = coMap[key]?.level ?? "";
        rowHtml += `<td class="text-center" contenteditable="true">${val}</td>`;
      }

      // PSO-1 to PSO-2
      for (let i = 1; i <= 2; i++) {
        const key = `PSO-${i}`;
        const val = coMap[key]?.level ?? "";
        rowHtml += `<td class="text-center" contenteditable="true">${val}</td>`;
      }

      rowHtml += "</tr>\n";
      matrixTable.append(rowHtml);
    });

    // Append legend row
    matrixTable.append(
      `<tr class="copo-legend-row"><td class="static text-center" colspan="14"><strong>3: Very Strong Contribution, 2: Strong Contribution, 1: Moderate Contribution</strong></td></tr>\n`
    );
  }

  // 7. Section 8: Teaching Hours Summary Table
  const hoursTable = $("h2:contains('Course Teaching and Learning Methods')").nextAll("table").first();
  if (hoursTable.length && spec.teaching_hours.total) {
    hoursTable.find("tr:last-child td:last-child").text(String(spec.teaching_hours.total));
  }

  // 8. Sanitize any remaining template sample strings (e.g. Computer Vision, AIC304A, AIML)
  let htmlResult = $.html();
  htmlResult = htmlResult
    .split("Computer Vision").join(spec.course.title)
    .split("AIC304A").join(spec.course.code)
    .split("AIML").join(spec.course.department);

  return htmlResult;
}
