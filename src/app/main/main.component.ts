import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MainStore } from './main.component.store';
import { provideComponentStore } from '@ngrx/component-store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxCaptureService } from 'ngx-capture';
import { DOCUMENT } from '@angular/common';
import { tap } from 'rxjs';

export interface SentinelRequest {
  extent?: number[];
  dateFrom: Date;
  dateTo: Date;
  cloudCoverage: number;
}

export interface MapSource {
  name: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  providers: [provideComponentStore(MainStore)],
})
export class MainComponent implements OnInit {
  dataSourceOptions = [
    { value: 'STAC', label: 'STAC' },
    { value: 'SentinelProcessingApi', label: 'Sentinel Processing API' },
    { value: 'BING', label: 'Bing Areal Map Screenshot' },
    // ...
  ];

  @ViewChild('screen', { static: true }) screen: any;
  img = '';

  sentinelForm: FormGroup = new FormGroup({});
  dataSourcesFrom: FormGroup = new FormGroup({});
  vm$ = this.mainStore.vm$;

  constructor(
    private mainStore: MainStore,
    private formBuilder: FormBuilder,
    private captureService: NgxCaptureService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.dataSourcesFrom = this.formBuilder.group({
      // ... other form controls
      selectBox: ['STAC', Validators.required], // Add the select box control
    });
    this.sentinelForm = this.formBuilder.group({
      dateFrom: [
        new Date('2023-06-01').toISOString().split('T')[0],
        Validators.required,
      ],
      dateTo: [
        new Date('2023-07-01').toISOString().split('T')[0],
        Validators.required,
      ],
      cloudCoverage: [
        22,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }

  onDrawEnd(extent: number[]) {
    console.log(this.sentinelForm.value);

    console.log('@#!#±@#±');

    if (this.sentinelForm.valid) {
      // Handle the form submission logic here
      console.log('Form submitted:', this.sentinelForm.value);
      this.mainStore.loadImage({
        extent: extent,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        cloudCoverage: this.cloudCoverage,
      });
    } else {
      // Mark all controls as touched to display validation messages
      this.sentinelForm.markAllAsTouched();
    }
  }

  // Accessor methods for form controls
  get dateFrom(): Date {
    return this.sentinelForm.get('dateFrom')?.value;
  }
  get dateTo(): Date {
    return this.sentinelForm.get('dateTo')?.value;
  }
  get cloudCoverage() {
    return this.sentinelForm.get('cloudCoverage')?.value;
  }

  onClassify() {
    this.mainStore.classify({
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      cloudCoverage: this.cloudCoverage,
    });
  }

  onObjectDetection() {
    this.mainStore.objectDetection({
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      cloudCoverage: this.cloudCoverage,
    });
  }

  onChangeMapSource(mapSource: any) {
    this.mainStore.mapSource({
      name: mapSource.target.value,
    });
  }
  onChangeDataSource(dataSourceType: any) {
    console.log(`Changed datasource to ${dataSourceType.target.value}`);
    this.mainStore.dataSource(dataSourceType.target.value);
  }
  onDetection(detectionType: any) {
    this.mainStore.detectionType(detectionType.target.value);
  }

  //TODO try dragging https://www.npmjs.com/package/ngx-capture
  onTakeScreenshot() {
    console.log('TAKE');
    this.captureService
      .getImage(this.document.getElementById('map')!, false, {
        x: 32,
        y: 30,
        width: 420,
        height: 420,
      })
      .pipe(
        tap((img: string) => {
          this.img = img;
          console.log(img);
        })
      )
      .subscribe((img) => {
        this.mainStore.bingTreeDetection(img);
      });
  }

  onBingObjectDetection() {
    this.captureService
      .getImage(this.document.getElementById('map')!, true)
      .subscribe((img) => {
        this.mainStore.bingObjectDetection(img);
      });
  }

  onDownloadScreenShot() {
    this.captureService
      .getImage(this.document.getElementById('map')!, true)
      .subscribe((img) => {
        this.captureService.downloadImage(img);
      });
  }
  loadImageSTAC(itemId: any) {
    this.mainStore.loadImageSTAC(itemId);
  }
  onLoadImage(itemId: any) {
    this.mainStore.loadImage(itemId);
  }
}
