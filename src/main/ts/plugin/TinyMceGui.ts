import * as $ from "jquery";
import {
  ProofreaderGui,
  message as msg,
  HtmlParagraphChunk,
  parseEl,
  ParsedHtml,
  cssMistakeBadValue,
  config,
  cssMistakeDescription,
  cssMistakeNoCorrection,
  Mistake,
} from "plinkorektor-core";

export class TinyMceGui extends ProofreaderGui {
  private editor;
  constructor(editor, stylesheetLoader: () => void = () => {}) {
    super();
    this.editor = editor;
    this.processing = $(this.editor.dom.select("html")[0]).attr(
      "data-pk-processing"
    );
    stylesheetLoader();
  }

  public setProcessing(processing: boolean) {
    if (processing) {
      msg("Processing indicator displayed.");
      $(this.editor.dom.select("html")[0]).attr("data-pk-processing", "true");
    } else {
      $(this.editor.dom.select("html")[0]).removeAttr("data-pk-processing");
      msg("Processing indicator hidden.");
    }
    this.processing = processing;
  }

  public isProcessing(): boolean {
    return this.processing;
  }

  public getChunks(): HtmlParagraphChunk[] {
    let content = $(this.editor.dom.select("html")[0]).find("p");
    let chunks: HtmlParagraphChunk[] = [];
    content.each((i, p) => {
      chunks.push(new HtmlParagraphChunk(p));
    });
    return chunks;
  }

  public wrapTokens(
    chunk: HtmlParagraphChunk,
    tokens: string[],
    tokenPos: { from: number; to: number }[]
  ) {
    let parsedHtml: ParsedHtml = parseEl($(chunk.getElement()));
    tokens.forEach(function (token, index) {
      parsedHtml.wrapToken(tokenPos[index].from, tokenPos[index].to, token);
    });
    $(chunk.getElement()).html(parsedHtml.getHtml());
  }

  public cleanTokens(chunk: HtmlParagraphChunk): void {
    $(chunk.getElement())
      .find(".pk-token")
      .replaceWith(function () {
        return $(this).contents();
      });
  }

  public getBookmark() {
    return this.editor.selection.getBookmark();
  }

  public moveToBookmark(bookmark) {
    this.editor.selection.moveToBookmark(bookmark);
  }

  public wrapMistakeContext(
    chunk: HtmlParagraphChunk,
    tokenId: number
  ): string {
    return (
      '<span style="' +
      cssMistakeBadValue +
      '">' +
      chunk.getTokenText(tokenId) +
      "</span>"
    );
  }

  public visualizeMistakes(chunk: HtmlParagraphChunk, pos: number, token) {
    // Removes original left-click triggers on tokens
    $(token).off("click");
    // Create dialog itself
    const currentMistakes = [];
    let suggestionRulebook = {};

    config.mistakes.getMistakes(chunk.getLastHash()).forEach((mistake) => {
      if (!mistake.getTokens().includes(pos)) {
        return;
      } // <-- continue;

      const dialogOutput = this.buildSuggestionDialog(chunk, mistake);

      suggestionRulebook = {
        ...suggestionRulebook,
        ...dialogOutput.partialRulebook,
      };
      currentMistakes.push({
        type: "panel",
        direction: "column",
        align: "stretch",
        items: dialogOutput.suggestions,
      });
    });

    $(token).click((e) => {
      e.preventDefault();
      this.editor.windowManager.open({
        title: "Návrh na opravu",
        body: {
          type: "panel",
          items: currentMistakes,
        },
        buttons: [],
        onAction: (instance, trigger) => {
          // Get mistake and correction information from the triger name.
          const [actionType, mistakeId, correctionId] = trigger.name.split("-");
          if (actionType == "correction") {
            this.fixMistake(chunk, mistakeId, suggestionRulebook[correctionId]);
            config.proofreader.process();
          } else if (actionType == "ignore") {
            this.ignoreMistake(chunk, mistakeId);
          } else if (actionType == "allcorrection") {
            this.fixAll(chunk, mistakeId, suggestionRulebook[correctionId]);
            config.proofreader.process();
          }
          this.editor.windowManager.close();
        },
      });
    });
  }

  protected fixMistake(
    chunk: HtmlParagraphChunk,
    mistakeId: string,
    correctionRules
  ) {
    Object.entries(correctionRules).forEach(
      ([target, correctValue]: [any, string]) => {
        // TODO SMARTER WAY TO REPLACE TOKENS (USE ENGINE FOR PARSING)
        let originalContent: string = $(chunk.getToken(target))[0].innerHTML;
        let contentParts = originalContent
          .replace(/(<[^(><.)]+>)/g, "|<>|$1|<>|")
          .split("|<>|");
        console.log(contentParts);
        let modifiedContentParts = contentParts.map((part) => {
          if (!part.match(/(<[^(><.)]+>)/)) {
            let newVal =
              correctValue.length > part.length
                ? correctValue.substring(0, part.length)
                : correctValue;
            correctValue =
              correctValue.length > part.length
                ? correctValue.slice(part.length)
                : "";
            return newVal;
          }
          return part;
        });
        if (correctValue.length > 0) {
          modifiedContentParts.push(correctValue);
        }
        let newContent = modifiedContentParts.join("");
        $(chunk.getToken(target))[0].innerHTML = newContent;
      }
    );

    // Remove mistake record to hide it afterwards.
    config.mistakes.removeMistake(chunk.getLastHash(), mistakeId);
  }

  private buildSuggestionDialog(chunk: HtmlParagraphChunk, mistake: Mistake) {
    const partialRulebook = {};
    const helperText = chunk.getContext(mistake);

    // Display mistake context
    const suggestions: any[] = [
      {
        type: "htmlpanel",
        html:
          '<p style="text-align: center">' +
          helperText +
          '</p><p style="' +
          cssMistakeDescription +
          '">' +
          mistake.getDescription() +
          "</p>",
      },
    ];

    // Display suggested corrections
    const mistakes = mistake.getCorrections();
    if (!mistakes.length) {
      suggestions.push({
        type: "htmlpanel",
        html: '<p style="' + cssMistakeNoCorrection + '">Žádné návrhy</p>',
      });
    }
    suggestions.push({
      type: "button",
      name: "ignore-" + mistake.getId(),
      text: "Ignorovat chybu",
      borderless: true,
    });

    mistakes.forEach((correction) => {
      partialRulebook[correction.getId()] = correction.getRules();
      suggestions.push(
        {
          type: "htmlpanel",
          html: correction.getDescription(),
        },
        {
          type: "grid",
          columns: 2,
          items: [
            {
              type: "button",
              name: "correction-" + mistake.getId() + "-" + correction.getId(),
              text: "Opravit jen tady",
              borderless: true,
            },
            {
              type: "button",
              name:
                "allcorrection-" + mistake.getId() + "-" + correction.getId(),
              text: "Opravit všude",
              borderless: true,
            },
          ],
        }
      );
    });
    if (mistake.getAbout().length) {
      suggestions.push({
        type: "htmlpanel",
        html: '<h4">Další informace</h4>',
      });
      mistake.getAbout().forEach((item) => {
        suggestions.push({
          type: "htmlpanel",
          html:
            '<a href="' +
            item.url +
            '" target="_blank" rel="noopener noreferrer">' +
            item.label +
            "</h4>",
        });
      });
    }
    return { suggestions, partialRulebook };
  }
}
