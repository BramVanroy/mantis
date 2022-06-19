# Mantis
*Segmentation interface for the TPR-DB to manually tokenize and sentence segment your data*

Some parts of this repository are still under construction. For questions, feel free to reach out.

## Installation

For the backend, install the `requirements.txt` file. For the frontend, run `npm start` in its respective folder.


## Citation

Vanroy, B. and Macken, L. (2022). LeConTra: A Learner Corpus of English-to-Dutch News Translation. In *Proceedings of the Language Resources and Evaluation Conference*, pages 1807-1816, Marseille, France. European Language Resources Association.

```bibtex
@InProceedings{vanroy-macken:2022:LREC,
  author    = {Vanroy, Bram  and  Macken, Lieve},
  title     = {LeConTra: A Learner Corpus of English-to-Dutch News Translation},
  booktitle = {Proceedings of the Language Resources and Evaluation Conference},
  month     = {June},
  year      = {2022},
  address   = {Marseille, France},
  publisher = {European Language Resources Association},
  pages     = {1807--1816},
  abstract  = {We present LeConTra, a learner corpus consisting of English-to-Dutch news translations enriched with translation process data. Three students of a Master's programme in Translation were asked to translate 50 different English journalistic texts of approximately 250 tokens each. Because we also collected translation process data in the form of keystroke logging, our dataset can be used as part of different research strands such as translation process research, learner corpus research, and corpus-based translation studies. Reference translations, without process data, are also included. The data has been manually segmented and tokenized, and manually aligned at both segment and word level, leading to a high-quality corpus with token-level process data. The data is freely accessible via the Translation Process Research DataBase, which emphasises our commitment of distributing our dataset. The tool that was built for manual sentence segmentation and tokenization, Mantis, is also available as an open-source aid for data processing.},
  url       = {https://aclanthology.org/2022.lrec-1.192}
}
